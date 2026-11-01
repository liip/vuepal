import { test, expect } from '@playwright/test'
import { isBuild } from './helpers'

// Only https://vuepal.ddev.site is a trusted origin of the playground, so the
// same site on http:// is not.
const UNTRUSTED_URL = 'http://vuepal.ddev.site/de/ueber-uns'

test.describe('trustedOrigins', () => {
  test('a trusted origin shows the page', async ({ page }) => {
    await page.goto('/de/ueber-uns')
    // The check runs between 0.5s and 2.5s after the page loaded.
    await page.waitForTimeout(3000)
    await expect(page.locator('.origin-error-message')).toHaveCount(0)
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
  })

  test('an untrusted origin shows an error in dev mode', async ({ page }) => {
    test.skip(isBuild, 'The production build redirects instead.')
    await page.goto(UNTRUSTED_URL)
    await expect(page.locator('.origin-error-message')).toBeVisible({
      timeout: 5000,
    })
  })

  test('an untrusted origin redirects in the production build', async ({
    page,
  }) => {
    test.skip(!isBuild, 'Only the production build redirects.')
    await page.goto(UNTRUSTED_URL)
    await expect(page).toHaveURL(/^https:\/\/vuepal\.ddev\.site\//, {
      timeout: 5000,
    })
  })
})
