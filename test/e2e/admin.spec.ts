import { test, expect } from '@playwright/test'
import { ADMIN_STORAGE_STATE, goto, isSpa, logIn } from './helpers'

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

test.describe('Drupal messages', () => {
  // The route query loads the messages with the routeGlobal fragment of the
  // queryFragments option.
  test('are shown after saving a node', async ({ page }, testInfo) => {
    // Logged in, both projects render the SPA. In parallel, Drupal would reject
    // one of the two saves of the node.
    test.skip(isSpa(testInfo), 'Runs in the ssr project only.')

    // Drupal removes the messages from the session once they are loaded. In
    // the session that the other tests share, they could load them first.
    await logIn(page)

    await page.goto('/de/node/2/edit')
    await page.locator('#edit-submit').click()
    await expect(page).toHaveURL('/de/ueber-uns/team')
    await expect(page.locator('.drupal-messages')).toHaveText(
      'Page Team has been updated.',
    )

    // They are only shown once.
    await page.reload()
    await expect(page.locator('.node-page h1')).toHaveText('Team')
    await expect(page.locator('.drupal-messages')).toHaveCount(0)
  })
})
