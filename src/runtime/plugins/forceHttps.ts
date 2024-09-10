import { defineNuxtPlugin } from '#imports'

/**
 * This plugin redirects to the https version on the dev environment, because
 * vite/HMR don't work via http.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    if (window.location.protocol === 'http:') {
      window.location.href = window.location.href.replace('http://', 'https://')
    }
  }
})
