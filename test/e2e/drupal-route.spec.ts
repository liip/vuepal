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

  test('exposes the Drupal route', async ({ page }) => {
    await goto(page, '/en/articles/first-article')
    const route = page.locator('.drupal-route')
    await expect(route).toHaveAttribute(
      'data-route-name',
      'entity.node.canonical',
    )
    await expect(route).toHaveAttribute('data-entity-type', 'node')
    await expect(route).toHaveAttribute('data-entity-bundle', 'article')
    await expect(route).toHaveAttribute('data-entity-id', '3')
  })

  test('shows a 404 page for an unknown path', async ({ page }, testInfo) => {
    const response = await page.goto('/de/gibt-es-nicht')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(404)
    }
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })

  test('shows a 404 page for a Drupal route without an entity', async ({
    page,
  }, testInfo) => {
    const response = await page.goto('/de/filter/tips')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(404)
    }
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })

  test('shows a 404 page for an entity that no fragment of the route query covers', async ({
    page,
  }, testInfo) => {
    // A node of the event bundle, which nodeCanonical has no fragment for.
    const response = await page.goto('/de/veranstaltungen/sommerfest')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(404)
    }
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })

  test('renders any entity with a route query without fragments', async ({
    page,
  }, testInfo) => {
    const response = await goto(page, '/de/neuigkeiten')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(200)
    }
    await expect(page.locator('.news-page')).toHaveText('The news page.')
    await expect(page).toHaveTitle('Neuigkeiten | vuepal')
    await expect(
      page.locator('.language-switch [hreflang="en"]'),
    ).toHaveAttribute('href', '/en/news')
  })

  test('shows a 404 page after client-side navigation', async ({ page }) => {
    await goto(page, '/de/ueber-uns')
    await page
      .locator('.navbar')
      .getByRole('link', { name: 'Not found' })
      .click()
    await expect(page.getByText('Page not found').first()).toBeVisible()
  })

  test('does not throw with noError for a path unknown to Drupal', async ({
    page,
  }, testInfo) => {
    const response = await goto(page, '/de/suche')
    if (!isSpa(testInfo)) {
      expect(response?.status()).toBe(200)
    }
    await expect(page.locator('.search-page')).toHaveText('The search page.')
  })
})

test.describe('vuepal:drupal-route hook', () => {
  test('receives the name and the entity of the route query', async ({
    page,
  }) => {
    await goto(page, '/en/articles/first-article')
    const hook = page.locator('.route-hook')
    await expect(hook).toHaveAttribute('data-query-name', 'nodeCanonical')
    await expect(hook).toHaveAttribute('data-entity-type', 'NodeArticle')
  })

  test('receives the entity of a route query without fragments', async ({
    page,
  }) => {
    await goto(page, '/de/neuigkeiten')
    const hook = page.locator('.route-hook')
    await expect(hook).toHaveAttribute('data-query-name', 'routeOnly')
    await expect(hook).toHaveAttribute('data-entity-type', 'NodePage')
  })

  test('receives no route query from useDrupalRoute()', async ({ page }) => {
    await goto(page, '/de/kontakt')
    await expect(page.locator('.node-page h1')).toHaveText('Kontakt')
    const hook = page.locator('.route-hook')
    await expect(hook).not.toHaveAttribute('data-query-name')
    await expect(hook).not.toHaveAttribute('data-entity-type')
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

  // "Über uns" has a description, "Team" has none.
  test('removes the tags of the previous page after client-side navigation', async ({
    page,
  }) => {
    await goto(page, '/de/ueber-uns')
    await expect(page.locator('meta[name="description"]')).toHaveCount(1)

    await page.locator('.navbar').getByRole('link', { name: 'Team' }).click()
    await expect(page.locator('.node-page h1')).toHaveText('Team')
    await expect(page).toHaveTitle('Team | vuepal')
    await expect(page.locator('meta[name="description"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(1)

    await page.goBack()
    await expect(page.locator('.node-page h1')).toHaveText('Über uns')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Wer hinter vuepal steht.',
    )
  })

  test('updates after switching the language', async ({ page }) => {
    await goto(page, '/de/artikel/erster-artikel')
    await page.locator('.language-switch [hreflang="en"]').click()
    await expect(page.locator('.node-article h1')).toHaveText('First article')
    await expect(page).toHaveTitle('First article | vuepal')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://vuepal.ddev.site/en/articles/first-article',
    )
  })
})
