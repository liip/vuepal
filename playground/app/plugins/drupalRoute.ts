import { defineNuxtPlugin, useState } from '#imports'

export type DrupalMessage = {
  type: string
  /** Filtered by graphql_messenger with Xss::filter(). */
  safe: string
}

export type RouteHookState = {
  queryName?: string
  entityType?: string
}

/**
 * Stores the data of the vuepal:drupal-route hook that PageHeader renders.
 */
export default defineNuxtPlugin({
  name: 'playground:drupal-route',
  setup(nuxtApp) {
    const messages = useState<DrupalMessage[]>('drupalMessages', () => [])
    const routeHook = useState<RouteHookState>('routeHook', () => ({}))

    nuxtApp.hook('vuepal:drupal-route', (payload) => {
      // From the routeGlobal fragment.
      messages.value = payload.routeQuery?.messengerMessages ?? []
      routeHook.value = {
        queryName: payload.queryName,
        entityType: payload.entity?.__typename,
      }
    })
  },
})
