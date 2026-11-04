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

    // This redirect is a 302 in Drupal.
    const temporary = await request.get('/de/alte-seite-mit-query', {
      maxRedirects: 0,
    })
    expect(temporary.status()).toBe(302)
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

  // graphql_core_schema returns a redirect to the login form, with the status
  // code 403. Browsers follow the meta refresh of the page, not the Location.
  test('redirects to the login form for an unpublished node', async ({
    page,
    request,
  }, testInfo) => {
    if (!isSpa(testInfo)) {
      const response = await request.get('/de/entwurf', { maxRedirects: 0 })
      expect(response.status()).toBe(403)
      expect(response.headers().location).toBe(
        '/de/user/login?destination=/de/entwurf',
      )
    }
    await page.goto('/de/entwurf')
    await expect(page).toHaveURL('/de/user/login?destination=/de/entwurf')
    await expect(page.locator('#edit-name')).toBeVisible()
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
