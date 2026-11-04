import { test as setup, expect } from '@playwright/test'
import { ADMIN_STORAGE_STATE, logIn } from './helpers'

setup('log in as admin', async ({ page }) => {
  await logIn(page)

  // Drupal's session cookie, also seen by the Nuxt server.
  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name.startsWith('SSESS'))).toBe(true)

  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
