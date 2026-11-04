import {
  type DrupalRouteQueries,
  mapping,
  entityTypes,
} from '#vuepal-build/route-queries'
import { useAsyncGraphqlQuery, useRoute, createError } from '#imports'
import type { UseDrupalRoute } from './../../helpers/drupalRoute'
import {
  setupDrupalRoute,
  handleDrupalRoute,
} from './../useDrupalRoute/internal'

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
 * - 404: Route does not exist in Drupal, there is no entity, or none of the
 *   fragments of the route query covers the entity's type.
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

  // All composables are called before the first await: an await inside a
  // composable loses the component instance. Then the metatags would not be
  // removed when the page unmounts, and on the server the Nuxt app would only
  // be available with experimental.asyncContext.
  const asyncData = useAsyncGraphqlQuery(
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

  const setup = setupDrupalRoute<E>(asyncData.data, route, {
    name,
    entityTypes: entityTypes[name],
  })

  const { data, error } = await asyncData

  // Throw an error when there was an error with the query, so that we
  // dont' serve a 404 for a page that would exist, but can not be loaded.
  if (error.value && !noError) {
    throw createError({
      statusCode: 500,
      statusMessage: error.value.message,
      fatal: true,
    })
  }

  // No watcher: it would throw a 404 while the data of the next route loads.
  const ctx = await handleDrupalRoute(setup, { noError, watch: false })

  // useDrupalRoute() has already started the redirect. On the client the
  // browser follows it asynchronously, so do not throw a 404 that would be
  // rendered in the meantime.
  if (ctx.redirect.value) {
    return ctx
  }

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
