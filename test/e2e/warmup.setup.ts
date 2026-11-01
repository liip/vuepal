import { test as setup, expect } from '@playwright/test'
import { isBuild, waitForHydration } from './helpers'

// The dev server compiles pages on the first request. Load a page once in
// both modes, so that the parallel tests do not all wait for it and time out.
setup('warm up the server', async ({ browser }, testInfo) => {
  setup.setTimeout(120_000)
  const modes: Record<string, string>[] = [{}, { 'x-vuepal-spa': '1' }]
  for (const extraHTTPHeaders of modes) {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders,
    })
    const page = await context.newPage()
    await page.goto('/de/ueber-uns', { timeout: 120_000 })
    await waitForHydration(page)
    await expect(page.locator('.node-page h1')).toHaveText('Über uns', {
      timeout: 60_000,
    })

    // Tests that only apply to one mode are skipped based on
    // VUEPAL_E2E_BUILD, so it has to match the server.
    const buildId = await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (window as any).useNuxtApp().$config.app.buildId,
    )
    expect(
      buildId === 'dev' ? 'dev server' : 'production build',
      'VUEPAL_E2E_BUILD=1 must be set exactly when testing a production build.',
    ).toBe(isBuild ? 'production build' : 'dev server')

    await context.close()
  }
})
