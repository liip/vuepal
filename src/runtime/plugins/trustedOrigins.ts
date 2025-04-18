import { defineNuxtPlugin, useState } from '#imports'
import {
  source,
  sourceLength,
  keyStringsEncoded,
  redirectHook,
} from '#vuepal-build/trusted-origins'
import { globalWindow, getStrings } from './../helpers/trustedOrigins'

/**
 * Validate the current origin.
 */
export default defineNuxtPlugin({
  setup(app) {
    if (import.meta.client) {
      if (source.length !== sourceLength) {
        throw new Error('Invalid source length.')
      }

      useState<string[]>(keyStringsEncoded).value = source

      function doRedirect() {
        getStrings(source, (strings) => {
          if (!globalWindow) throw Error()

          const _location = strings[1]
          const _href = strings[13]
          const redirectTo = strings[14]

          // In dev mode, throw an error instead.
          if (import.meta.dev) {
            throw new Error(
              `vuepal trustedOrigins: A redirect to "${redirectTo}" would happen here in the production build. Make sure your current origin is allowed in vuepal.trustedOrigins.origins in nuxt.config.ts`,
            )
          }

          if (redirectTo) {
            // Obfuscated window.location.href.
            globalWindow[_location][_href] = redirectTo
            return
          }

          throw new Error()
        })
      }

      // @ts-expect-error Untyped.
      app.hooks.hook(redirectHook, doRedirect)
    }
  },
})
