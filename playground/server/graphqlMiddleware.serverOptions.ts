import { defineGraphqlServerOptions } from 'nuxt-graphql-middleware/server-options'
import { useRuntimeConfig } from '#imports'
import { getForwardedHeaders } from '#shared/forwardedHeaders'

export default defineGraphqlServerOptions<{ language: string }>({
  graphqlEndpoint(_event, _operation, _operationName, context) {
    const language = context?.client?.language || 'de'
    return `${useRuntimeConfig().drupalUrl}/${language}/graphql`
  },

  serverFetchOptions(event) {
    return { headers: getForwardedHeaders(event) }
  },
})
