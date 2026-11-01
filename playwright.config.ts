import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests for the playground, running against the ddev site.
 *
 * Start it with `ddev setup` (once) and `ddev frontend`, see README.md.
 */
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'https://vuepal.ddev.site',
    // ddev's certificate is not trusted in CI.
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Every spec runs twice: rendered on the server, and as an SPA like for
    // logged in users (see playground/server/middleware/spa.ts).
    {
      name: 'ssr',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'spa',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: { 'x-vuepal-spa': '1' },
      },
    },
  ],
})
