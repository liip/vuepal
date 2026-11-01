import { defineEventHandler, getRequestHeader } from 'h3'

/**
 * Render pages on the client only (SPA mode) for logged in users.
 *
 * Projects based on the blökkli starterkit do the same. The E2E tests can also
 * force SPA mode with the x-vuepal-spa header, to run every test in both modes.
 */
export default defineEventHandler((event) => {
  const path = event.path
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/')) {
    return
  }

  const hasSession = (getRequestHeader(event, 'cookie') || '').includes('SSESS')
  if (hasSession || getRequestHeader(event, 'x-vuepal-spa')) {
    event.context.nuxt ||= {}
    event.context.nuxt.noSSR = true
  }
})
