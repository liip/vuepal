import { test as setup, expect } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from './helpers'

// The admin account is created by `ddev setup`.
setup('log in as admin', async ({ page }) => {
  await page.goto('/de/user/login')
  await page.locator('#edit-name').fill('admin')
  await page.locator('#edit-pass').fill('admin')
  await page.locator('#edit-submit').click()
  await expect(page).toHaveURL(/\/de\/user\/1/)

  // Drupal's session cookie, also seen by the Nuxt server.
  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name.startsWith('SSESS'))).toBe(true)

  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
