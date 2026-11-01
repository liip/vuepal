import { test, expect } from '@playwright/test'
import { ADMIN_STORAGE_STATE, goto } from './helpers'

test.describe('anonymous', () => {
  test('the admin toolbar has no links', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
    await expect(page.locator('.vuepal-admin-toolbar a')).toHaveCount(0)
  })

  test('only the view local task is shown', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('.vuepal-local-tasks a')).toHaveText(['View'])
  })
})

test.describe('logged in', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE })

  test('pages are rendered on the client only', async ({ page }) => {
    const response = await page.goto('/de/ueber-uns')
    expect(await response?.text()).not.toContain('node-page')
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
  })

  test('the admin toolbar shows the admin menu', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    await expect(
      toolbar.getByRole('link', { name: 'Structure', exact: true }),
    ).toHaveAttribute('href', '/de/admin/structure')
  })

  test('the admin toolbar has the color of the environment', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('.vuepal-admin-toolbar')).toHaveCSS(
      'border-top-color',
      'rgb(11, 110, 79)',
    )
  })

  test('local tasks link to the Drupal forms', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    const tasks = page.locator('.vuepal-local-tasks')
    await expect(tasks.getByRole('link', { name: 'View' })).toHaveClass(
      /vp-is-active/,
    )
    await expect(tasks.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/de/node/1/edit',
    )
    await expect(tasks.getByRole('link', { name: 'Translate' })).toBeVisible()
  })

  test('a local task opens the Drupal form', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page
      .locator('.vuepal-local-tasks')
      .getByRole('link', { name: 'Edit' })
      .click()
    await expect(page).toHaveURL('/de/node/1/edit')
    await expect(page.locator('#edit-title-0-value')).toHaveValue('Über uns')
  })
})
