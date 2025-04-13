import { defineGraphqlClientOptions } from 'nuxt-graphql-middleware/client-options'
import { useCurrentLanguage } from '#imports'

export default defineGraphqlClientOptions<{
  language: string
}>({
  buildClientContext() {
    const language = useCurrentLanguage()

    return {
      language: language.value,
    }
  },
})
