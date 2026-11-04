import { test, expect, type Page } from '@playwright/test'
import { goto } from './helpers'

function embedUrl(page: Page, url: string) {
  return page.locator(`[data-url="${url}"] .embed-url`)
}

test('builds the embed URL of YouTube and Vimeo videos', async ({ page }) => {
  await goto(page, '/de/video')
  await expect(
    embedUrl(page, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ).toHaveText(/^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?/)
  await expect(embedUrl(page, 'https://youtu.be/dQw4w9WgXcQ?t=10')).toHaveText(
    /^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?/,
  )
  await expect(embedUrl(page, 'https://vimeo.com/76979871')).toHaveText(
    /^https:\/\/player\.vimeo\.com\/video\/76979871\?/,
  )
})

test('renders nothing for an invalid YouTube ID', async ({ page }) => {
  await goto(page, '/de/video')
  await expect(embedUrl(page, 'https://vimeo.com/76979871')).toBeVisible()
  await expect(
    embedUrl(page, 'https://www.youtube.com/watch?v=../../abcde'),
  ).toHaveCount(0)
})
