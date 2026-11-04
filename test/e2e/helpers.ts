import { expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Session of the admin user, written by auth.setup.ts.
 */
export const ADMIN_STORAGE_STATE = 'test/e2e/.auth/admin.json'

/**
 * Whether the test runs in the "spa" project (no server-side rendering).
 */
export function isSpa(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'spa'
}

/**
 * Whether the tests run against a production build of the playground.
 */
export const isBuild = !!process.env.VUEPAL_E2E_BUILD

/**
 * Wait until Nuxt has hydrated (SSR) or mounted (SPA) the app.
 *
 * Links clicked before that are full page loads instead of client-side
 * navigations.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).useNuxtApp?.().isHydrating === false,
  )
}

/**
 * Go to a path and wait until the app is interactive.
 */
export async function goto(page: Page, path: string) {
  const response = await page.goto(path)
  await waitForHydration(page)
  return response
}

/**
 * Log in as admin with the Drupal login form, in a new Drupal session.
 *
 * The admin account is created by `ddev setup`.
 */
export async function logIn(page: Page) {
  await page.goto('/de/user/login')
  await page.locator('#edit-name').fill('admin')
  await page.locator('#edit-pass').fill('admin')
  await page.locator('#edit-submit').click()
  await expect(page).toHaveURL(/\/de\/user\/1/)
}
