import { defineNuxtPlugin, useState } from '#imports'
import type { BreadcrumbFragment } from '#graphql-operations'
import { getBreadcrumbFromRouteQuery } from '#vuepal/helpers/breadcrumb'

/**
 * Manages the breadcrumb state.
 */
export default defineNuxtPlugin({
  name: 'vuepal:breadcrumb',
  setup(app) {
    const state = useState<BreadcrumbFragment[]>('breadcrumbLinks', () => [])

    // Called by useDrupalRoute.
    app.hooks.hook('vuepal:drupal-route', (data) => {
      state.value = getBreadcrumbFromRouteQuery(data.routeQuery)
    })
  },
})
