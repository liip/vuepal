import { type DrupalRouteQueries, mapping } from '#vuepal-build/route-queries'
import {
  useAsyncGraphqlQuery,
  useRoute,
  useDrupalRoute,
  createError,
} from '#imports'
import type { UseDrupalRoute } from './../../helpers/drupalRoute'

type ValidRouteQueryName = keyof DrupalRouteQueries

type UseDrupalRouteQueryOptions = {
  /**
   * Whether responses should be cached on the client.
   */
  clientCache?: boolean
}

/**
 * Performs a route query with the given name.
 *
 * Route queries are managed in nuxt.config.ts, in the vuepal.drupalRoute.routeQueries option.
 */
export async function useDrupalRouteQuery<
  T extends ValidRouteQueryName,
  E extends DrupalRouteQueries[T],
>(
  name: T,
  options?: UseDrupalRouteQueryOptions,
): Promise<UseDrupalRoute<E | undefined>> {
  const route = useRoute()

  const queryName = mapping[name]

  const { data } = await useAsyncGraphqlQuery(
    queryName,
    {
      path: route.path,
    },
    {
      transform: function (data) {
        return data.data
      },
      graphqlCaching: {
        client: options?.clientCache ?? true,
      },
    },
  )

  const ctx = await useDrupalRoute<E>(data)

  // We only support EntityCanonicalUrl in this query.
  if (
    data.value &&
    'route' in data.value &&
    data.value.route?.__typename !== 'EntityCanonicalUrl'
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    })
  }

  return ctx
}
