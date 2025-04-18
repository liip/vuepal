import { defineNuxtPlugin, useState } from '#imports'

export default defineNuxtPlugin({
  name: 'vuepal:language-switch-links',
  setup(app) {
    const pageLanguageLinksPath = useState<string>(
      'pageLanguageLinksPath',
      () => '',
    )
    const pageLanguageLinksLinks = useState<Record<string, string> | null>(
      'pageLanguageLinksLinks',
      () => null,
    )

    // Called by useDrupalRoute.
    app.hooks.hook('vuepal:drupal-route', (data) => {
      const route = data.routeQuery?.route
      if (
        route &&
        'languageSwitchLinks' in route &&
        route.languageSwitchLinks
      ) {
        pageLanguageLinksLinks.value = route.languageSwitchLinks.reduce<
          Record<string, string>
        >((acc, v) => {
          if (v.language.id && v.url.path) {
            acc[v.language.id] = v.url.path
          }

          return acc
        }, {})

        pageLanguageLinksPath.value = data.path
      }
    })
  },
})
