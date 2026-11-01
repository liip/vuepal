import { test, expect } from '@playwright/test'
import { goto } from './helpers'

test.describe('language switch links', () => {
  test('link to the translation of the page', async ({ page }) => {
    await goto(page, '/de/ueber-uns/team')
    const links = page.locator('.language-switch')
    await expect(links.locator('[hreflang="en"]')).toHaveAttribute(
      'href',
      '/en/about-us/team',
    )
    await expect(links.locator('[hreflang="de"]')).toHaveClass(/is-active/)
  })

  test('switch to the translation', async ({ page }) => {
    await goto(page, '/de/ueber-uns/team')
    await page.locator('.language-switch [hreflang="en"]').click()
    await expect(page).toHaveURL('/en/about-us/team')
    await expect(page.locator('.breadcrumb')).toContainText('About us')
  })
})

test.describe('breadcrumb', () => {
  test('contains the parent pages', async ({ page }) => {
    await goto(page, '/de/ueber-uns/team')
    const links = page.locator('.breadcrumb a')
    await expect(links).toHaveText(['Home', 'Über uns'])
    await expect(links.nth(1)).toHaveAttribute('href', '/de/ueber-uns')
  })

  test('updates after client-side navigation', async ({ page }) => {
    await goto(page, '/de/ueber-uns/team')
    await page.locator('.breadcrumb a', { hasText: 'Über uns' }).click()
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
    await expect(page.locator('.breadcrumb a')).toHaveText(['Home'])
  })
})
