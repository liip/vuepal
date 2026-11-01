import { test, expect } from '@playwright/test'
import { goto, isSpa } from './helpers'

test.describe('useDrupalRouteQuery()', () => {
  test('renders a page node', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
  })

  test('renders an article with its own fragment', async ({ page }) => {
    await goto(page, '/en/articles/first-article')
    await expect(page.locator('.node-article h1')).toHaveText('First article')
    await expect(page.locator('.node-article .lead')).toHaveText(
      'The lead of the first article.',
    )
  })

  test('shows a 404 page for an unknown path', async ({ page }, testInfo) => {
    const response = await page.goto('/de/gibt-es-nicht')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(404)
    }
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })

  test('shows a 404 page after client-side navigation', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page
      .locator('.navbar')
      .getByRole('link', { name: 'Not found' })
      .click()
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })
})

test.describe('metatags', () => {
  test('sets title, description and canonical URL', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page).toHaveTitle('Über uns | vuepal')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Wer hinter vuepal steht.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://vuepal.ddev.site/de/ueber-uns',
    )
  })

  test('adds the schema.org JSON-LD', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    const json = await page
      .locator('script[type="application/ld+json"]')
      .textContent()
    expect(JSON.parse(json || '{}')['@graph'][0]).toMatchObject({
      '@type': 'WebPage',
      '@id': 'https://vuepal.ddev.site/de/ueber-uns',
    })
  })

  test('updates after client-side navigation', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page.locator('.navbar').getByRole('link', { name: 'Artikel' }).click()
    await expect(page.locator('.node-article h1')).toHaveText('Erster Artikel')
    await expect(page).toHaveTitle('Erster Artikel | vuepal')
  })
})
