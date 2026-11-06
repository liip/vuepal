import { test, expect, type Locator, type Page } from '@playwright/test'
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

  // content.php adds an admin menu link with markup in its label.
  test('the command palette renders menu labels as text', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page.keyboard.press('ControlOrMeta+KeyK')
    await page.locator('.vuepal-command-palette-input input').fill('vuepal')

    const item = page.locator('.vuepal-command-palette-item').first()
    await expect(item).toContainText(
      'Vuepal <img src=x onerror="window.vuepalXss=true">',
    )
    await expect(item.locator('img')).toHaveCount(0)
    await expect(item.locator('em')).toHaveText(['Vuepal'])
  })
})

// The rules are documented in src/runtime/helpers/hoverIntent.ts. The pointer
// only moves when the test moves it. "Right away" is checked once with
// isVisible(), which doesn't wait: a delayed submenu is at least 100ms late.
test.describe('admin toolbar submenus', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE })

  async function center(locator: Locator) {
    const box = (await locator.boundingBox())!
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  async function openStructure(page: Page) {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    await toolbar.getByRole('link', { name: 'Structure', exact: true }).hover()
    await expect(
      toolbar.getByRole('link', { name: 'Content types', exact: true }),
    ).toBeVisible()
    return toolbar
  }

  test('open when the pointer rests on a link', async ({ page }) => {
    await openStructure(page)
  })

  test('open right away when the pointer moves up into the toolbar', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    const link = await center(
      toolbar.getByRole('link', { name: 'Structure', exact: true }),
    )
    await page.mouse.move(link.x, link.y + 300)
    await page.mouse.move(link.x, link.y, { steps: 5 })
    expect(
      await toolbar
        .getByRole('link', { name: 'Content types', exact: true })
        .isVisible(),
    ).toBe(true)
  })

  test('do not open when the pointer passes over the links', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    const box = (await toolbar.boundingBox())!
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + 1, y)
    // Ends right of the last link, still inside the toolbar.
    await page.mouse.move(box.x + box.width - 1, y, { steps: 20 })
    // Proving that nothing opens needs a wait longer than the delay.
    await page.waitForTimeout(300)
    await expect(toolbar.locator('li ul')).toHaveCount(0)
  })

  test('switch right away once a submenu is open', async ({ page }) => {
    const toolbar = await openStructure(page)
    const link = await center(
      toolbar.getByRole('link', { name: 'Content', exact: true }),
    )
    await page.mouse.move(link.x, link.y, { steps: 5 })
    expect(
      await toolbar
        .getByRole('link', { name: 'Add content', exact: true })
        .isVisible(),
    ).toBe(true)
  })

  test('open the submenus of a submenu right away', async ({ page }) => {
    const toolbar = await openStructure(page)
    const link = await center(
      toolbar.getByRole('link', { name: 'Content types', exact: true }),
    )
    await page.mouse.move(link.x, link.y, { steps: 5 })
    expect(
      await toolbar
        .getByRole('link', { name: 'Add content type', exact: true })
        .isVisible(),
    ).toBe(true)
  })

  /**
   * Open the submenu of "Content types", then move diagonally down towards it,
   * across the link below "Content types".
   */
  async function crossSibling(page: Page) {
    const toolbar = await openStructure(page)
    await toolbar
      .getByRole('link', { name: 'Content types', exact: true })
      .hover()
    const submenuLink = toolbar.getByRole('link', {
      name: 'Page',
      exact: true,
    })
    await expect(submenuLink).toBeVisible()
    const sibling = (await toolbar
      .getByRole('link', { name: /^Vuepal/ })
      .boundingBox())!
    await page.mouse.move(
      sibling.x + sibling.width - 20,
      sibling.y + sibling.height / 2,
      { steps: 5 },
    )
    return submenuLink
  }

  test('stay open while the pointer crosses a sibling on its way to the submenu', async ({
    page,
  }) => {
    const submenuLink = await crossSibling(page)
    const target = await center(submenuLink)
    await page.mouse.move(target.x, target.y, { steps: 5 })
    await page.waitForTimeout(400)
    await expect(submenuLink).toBeVisible()
  })

  test('switch to a crossed sibling when the pointer stops on it', async ({
    page,
  }) => {
    const submenuLink = await crossSibling(page)
    await expect(submenuLink).toBeHidden()
  })
})

// <VuepalAdminToolbar> looks like the horizontal toolbar of Gin with
// admin_toolbar. Comparing it with the Drupal toolbar shows when Gin changes.
test.describe('admin toolbar styles', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE })

  /**
   * The text, box, font and colors of the visible links.
   */
  function getLinkStyles(links: Locator) {
    return links.evaluateAll((elements) =>
      elements
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const box = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          // Gin draws the icons with ::before.
          const icon = el.querySelector('.vuepal-admin-toolbar-icon')
          const before = getComputedStyle(el, '::before')
          return {
            // The logo hides its text, which isn't the same: "Drupal" in
            // Drupal, the title of the menu link in vuepal.
            text: style.textIndent === '0px' ? el.textContent?.trim() : null,
            box: [box.x, box.y, box.width, box.height].map(Math.round),
            font: `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`,
            color: style.color,
            background: style.backgroundColor,
            icon: icon
              ? getComputedStyle(icon).backgroundColor
              : before.content === 'none' || before.display === 'none'
                ? null
                : before.backgroundColor,
          }
        }),
    )
  }

  /**
   * The styles of the toolbar at rest, with the submenu of "Structure" open,
   * and with the submenu of "Content types" open.
   *
   * @param bar - The list of the top-level links.
   */
  async function getToolbarStyles(page: Page, path: string, bar: string) {
    await page.mouse.move(0, 500)
    await page.goto(path)
    const links = page.locator(`${bar} > li > a`)
    // Logged in, the app renders on the client only, so the toolbar is
    // interactive once it's visible.
    await expect(links.first()).toBeVisible()
    await page.evaluate(() => document.fonts.load('13px Ginter'))

    const item = (list: Locator, text: string) =>
      list
        .locator(':scope > li')
        .filter({ has: page.locator(':scope > a', { hasText: text }) })
    const structure = item(page.locator(bar), 'Structure')
    const contentTypes = item(structure.locator(':scope > ul'), 'Content types')

    const atRest = await getLinkStyles(links)
    await structure.locator(':scope > a').hover()
    await expect(contentTypes).toBeVisible()
    const structureOpen = {
      links: await getLinkStyles(links),
      submenu: await getLinkStyles(structure.locator(':scope > ul > li > a')),
    }
    await contentTypes.locator(':scope > a').hover()
    await expect(contentTypes.locator(':scope > ul')).toBeVisible()
    const contentTypesOpen = {
      submenu: await getLinkStyles(structure.locator(':scope > ul > li > a')),
      submenuOfSubmenu: await getLinkStyles(
        contentTypes.locator(':scope > ul > li > a'),
      ),
    }
    return { atRest, structureOpen, contentTypesOpen }
  }

  test('are the same as in Drupal', async ({ page }) => {
    const drupal = await getToolbarStyles(
      page,
      // No link of the toolbar is in the active trail of this page.
      '/de/user/1',
      '#toolbar-item-administration-tray .toolbar-menu-administration > .toolbar-menu',
    )
    const vuepal = await getToolbarStyles(
      page,
      '/de/ueber-uns',
      '.vuepal-admin-toolbar > ul',
    )
    expect(vuepal).toEqual(drupal)
  })
})

// When the bar doesn't fit, the Drupal logo and a button that opens the links
// in a sidebar replace it.
test.describe('admin toolbar on narrow screens', () => {
  test.use({
    storageState: ADMIN_STORAGE_STATE,
    viewport: { width: 600, height: 700 },
  })

  async function openSidebar(page: Page) {
    await goto(page, '/de/ueber-uns')
    const button = page.getByRole('button', { name: 'Verwalten' })
    await button.click()
    const sidebar = page.locator('.vuepal-admin-toolbar-sidebar')
    await expect(sidebar).toBeVisible()
    return { button, sidebar }
  }

  test('collapse exactly when the bar does not fit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 })
    await goto(page, '/de/ueber-uns')
    const bar = page.locator(
      '.vuepal-admin-toolbar > .vuepal-admin-toolbar-bar',
    )
    const structure = bar.getByRole('link', { name: 'Structure', exact: true })
    const button = page.getByRole('button', { name: 'Verwalten' })
    await expect(structure).toBeVisible()
    await expect(button).toHaveCount(0)

    // The bar is as wide as its links, with margins of up to 48px.
    await page.evaluate(() => document.fonts.load('13px Ginter'))
    const width = await bar.evaluate((el) => el.getBoundingClientRect().width)
    const fits = Math.ceil(width) + 2 * 48
    await page.setViewportSize({ width: fits - 20, height: 700 })
    await expect(button).toBeVisible()
    await expect(structure).toBeHidden()
    await page.setViewportSize({ width: fits + 20, height: 700 })
    await expect(structure).toBeVisible()
    await expect(button).toHaveCount(0)
  })

  test('open every level of the links in the sidebar', async ({ page }) => {
    const { sidebar } = await openSidebar(page)
    // The Drupal logo stays in the bar.
    await expect(sidebar.locator('[data-route-name="<front>"]')).toHaveCount(0)
    await expect(
      sidebar.getByRole('link', { name: 'Structure', exact: true }),
    ).toHaveAttribute('href', '/de/admin/structure')

    const toggle = (name: string) =>
      sidebar.getByRole('button', { name, exact: true })
    await toggle('Structure').click()
    await expect(toggle('Structure')).toHaveAttribute('aria-expanded', 'true')
    await toggle('Content types').click()
    await expect(
      sidebar.getByRole('link', { name: 'Article', exact: true }),
    ).toBeVisible()

    // One open submenu per list.
    await toggle('Content').click()
    await expect(
      sidebar.getByRole('link', { name: 'Block layout', exact: true }),
    ).toHaveCount(0)
  })

  test('close the sidebar with Escape', async ({ page }) => {
    const { button, sidebar } = await openSidebar(page)
    await page.keyboard.press('Tab')
    await expect(
      sidebar.getByRole('link', { name: 'Content', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(sidebar).toBeHidden()
    await expect(button).toBeFocused()
  })

  test('close the sidebar on a click outside', async ({ page }) => {
    const { sidebar } = await openSidebar(page)
    await page.mouse.click(500, 600)
    await expect(sidebar).toBeHidden()
  })

  test('the button is labeled in the current language', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('.vuepal-admin-toolbar-menu-button')).toHaveText(
      'Verwalten',
    )
    await goto(page, '/en/about-us')
    await expect(page.locator('.vuepal-admin-toolbar-menu-button')).toHaveText(
      'Manage',
    )
  })

  test('the Drupal logo opens its submenu on hover', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    const collapsed = page.locator('.vuepal-admin-toolbar-collapsed')
    await collapsed.locator('[data-route-name="<front>"]').hover()
    await expect(
      collapsed.getByRole('link', { name: 'Flush all caches', exact: true }),
    ).toBeVisible()
  })
})

// Touch has no hover: the first tap on a link with a submenu opens it.
test.describe('admin toolbar on touch screens', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE, hasTouch: true })

  test('the first tap opens the submenu, the second follows the link', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    const link = (name: string) =>
      toolbar.getByRole('link', { name, exact: true })

    await link('Structure').tap()
    await expect(link('Content types')).toBeVisible()
    await link('Content types').tap()
    await expect(link('Add content type')).toBeVisible()
    await expect(page).toHaveURL('/de/ueber-uns')

    await link('Content types').tap()
    await expect(page).toHaveURL('/de/admin/structure/types')
  })

  test('a tap outside closes the submenus', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    const toolbar = page.locator('.vuepal-admin-toolbar')
    await toolbar.getByRole('link', { name: 'Structure', exact: true }).tap()
    const submenuLink = toolbar.getByRole('link', {
      name: 'Content types',
      exact: true,
    })
    await expect(submenuLink).toBeVisible()
    await page.touchscreen.tap(600, 500)
    await expect(submenuLink).toBeHidden()
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
    // Gin's save button in the sticky header. The fixed toolbar covers the
    // form's own button.
    await page.locator('#gin-sticky-edit-submit').click()
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
