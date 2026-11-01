import { test, expect } from '@playwright/test'
import { goto } from './helpers'

// The contact page is a Nuxt page. The frontendRouting feature writes its
// paths to frontend_routing.settings.yml, which the test site imports, and
// Drupal assigns a node to them.
test.describe('frontendRouting', () => {
  test('the Nuxt page loads the node assigned in Drupal', async ({ page }) => {
    await goto(page, '/de/kontakt')
    await expect(page.locator('.node-page h1')).toHaveText('Kontakt')
  })

  test('uses the path of each language', async ({ page }) => {
    await goto(page, '/de/kontakt')
    await page.locator('.language-switch [hreflang="en"]').click()
    await expect(page).toHaveURL('/en/contact-us')
    await expect(page.locator('.node-page h1')).toHaveText('Contact')
  })

  test('is reachable by its route name', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page.locator('.navbar').getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL('/de/kontakt')
    await expect(page.locator('.node-page h1')).toHaveText('Kontakt')
  })
})
