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

  /**
   * If true, the composable will not throw any errors.
   */
  noError?: boolean
}

/**
 * Performs a route query with the given name.
 *
 * Route queries are managed in nuxt.config.ts, in the vuepal.drupalRoute.routeQueries option.
 *
 * The composable will throw these errors:
 * - 500: The route query itself has an error (e.g. backend is down)
 * - 404: Route does not exist in Drupal or there is no entity.
 *
 * You can prevent throwing any errors by passing `{ noError: true }` as the second argument.
 */
export async function useDrupalRouteQuery<
  T extends ValidRouteQueryName,
  E extends DrupalRouteQueries[T],
>(
  name: T,
  options?: UseDrupalRouteQueryOptions,
): Promise<UseDrupalRoute<E | undefined>> {
  const noError = !!options?.noError
  const route = useRoute()

  const queryName = mapping[name]

  const { data, error } = await useAsyncGraphqlQuery(
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
      deep: false,
    },
  )

  // Throw an error when there was an error with the query, so that we
  // dont' serve a 404 for a page that would exist, but can not be loaded.
  if (error.value && !noError) {
    throw createError({
      statusCode: 500,
      statusMessage: error.value.message,
      fatal: true,
    })
  }

  // Don't pass the reactive object, because it will cause a 404 being thrown
  // by the watcher in useDrupalRoute().
  const ctx = await useDrupalRoute<E>(
    data.value,
    {
      // @ts-expect-error issue with overload, boolean is correct.
      noError,
    },
    route,
  )

  // We only support EntityCanonicalUrl in this query.
  if (
    !noError &&
    data.value &&
    'route' in data.value &&
    data.value.route &&
    data.value.route.__typename &&
    !['EntityCanonicalUrl', 'DefaultEntityUrl'].includes(
      data.value.route?.__typename,
    )
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    })
  }

  return ctx
}
