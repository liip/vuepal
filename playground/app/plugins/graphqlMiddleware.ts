import { defineNuxtPlugin, useGraphqlState, useRequestEvent } from '#imports'
import { getForwardedHeaders } from '#shared/forwardedHeaders'

/**
 * During SSR, GraphQL requests go from the Nuxt app to the GraphQL middleware
 * without the headers of the browser request. Pass them on, like the starterkit
 * does, so that Drupal sees the public host and the session.
 */
export default defineNuxtPlugin({
  name: 'playground:graphql-headers',
  dependsOn: ['nuxt-graphql-middleware-provide-state'],
  setup() {
    if (!import.meta.server) {
      return
    }

    const state = useGraphqlState()
    const event = useRequestEvent()
    if (state && event) {
      state.fetchOptions.headers = getForwardedHeaders(event)
    }
  },
})
