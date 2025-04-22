import { defineNuxtPlugin, useState } from '#imports'
import type { Langcode } from '#nuxt-language-negotiation/config'

export default defineNuxtPlugin({
  name: 'vuepal:language-switch-links',
  setup(app) {
    const stateLinks = useState<Record<string, Record<Langcode, string>>>(
      'pageLanguageLinks',
      () => {
        return {}
      },
    )

    // Called by useDrupalRoute.
    app.hooks.hook('vuepal:drupal-route', (data) => {
      if (stateLinks.value[data.path]) {
        return
      }

      const route = data.routeQuery?.route
      if (
        route &&
        'languageSwitchLinks' in route &&
        route.languageSwitchLinks
      ) {
        stateLinks.value[data.path] = route.languageSwitchLinks.reduce<
          Record<string, string>
        >((acc, v) => {
          if (v.language.id && v.url.path) {
            acc[v.language.id] = v.url.path
          }

          return acc
        }, {})
      }
    })
  },
})
