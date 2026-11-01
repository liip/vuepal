import { test, expect } from '@playwright/test'
import { goto, isSpa } from './helpers'

test.describe('redirects', () => {
  test('the server sends the redirect with its status code', async ({
    request,
  }, testInfo) => {
    test.skip(isSpa(testInfo), 'In SPA mode the client redirects.')
    const response = await request.get('/de/alte-seite?utm_source=test', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe('/de/ueber-uns?utm_source=test')
  })

  test('keeps the current query parameters', async ({ page }) => {
    await page.goto('/de/alte-seite?utm_source=test')
    await expect(page).toHaveURL('/de/ueber-uns?utm_source=test')
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
  })

  test('does not add the current query to a target with its own query', async ({
    page,
  }) => {
    await page.goto('/de/alte-seite-mit-query?utm_source=test')
    await expect(page).toHaveURL('/de/ueber-uns?von=redirect')
  })

  test('redirects after client-side navigation', async ({ page }) => {
    await goto(page, '/de/artikel/erster-artikel')
    await page
      .locator('.navbar')
      .getByRole('link', { name: 'Redirect', exact: true })
      .click()
    await expect(page).toHaveURL('/de/ueber-uns')
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
  })

  // The browser downloads the target and stays on the page. Before the fix in
  // PR #9 it showed a 404 page.
  test('shows the redirect target when the browser stays on the page', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    const download = page.waitForEvent('download')
    await page
      .locator('.navbar')
      .getByRole('link', { name: 'Redirect to download' })
      .click()
    expect((await download).suggestedFilename()).toBe('vuepal-download.zip')

    await expect(page.getByText('You are being redirected.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/sites/default/files/vuepal-download.zip',
    )
    await expect(page.getByText('Page not found')).toHaveCount(0)
  })

  test('shows the redirect target on a direct load in SPA mode', async ({
    page,
  }, testInfo) => {
    test.skip(!isSpa(testInfo), 'With SSR the server redirects.')
    const download = page.waitForEvent('download')
    await page.goto('/de/download')
    await download
    await expect(page.getByText('You are being redirected.')).toBeVisible()
    await expect(page.getByText('Page not found')).toHaveCount(0)
  })
})
