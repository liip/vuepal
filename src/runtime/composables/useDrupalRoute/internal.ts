import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { withQuery } from 'ufo'
import type { NuxtApp } from '#app'
import type { UseDrupalRouteFragment } from '#graphql-operations'
import type { DrupalRouteQueries } from '#vuepal-build/route-queries'
import { buildDrupalMetatags } from './../buildDrupalMetatags'
import {
  useNuxtApp,
  useHead,
  computed,
  navigateTo,
  createError,
  watch,
  useRoute,
  type ComputedRef,
  type Ref,
} from '#imports'
import type { DrupalRoute, UseDrupalRoute } from './../../helpers/drupalRoute'
import type { DrupalRouteMetatags } from '../../types/metatags'

/**
 * The route query that useDrupalRouteQuery() was called with, and its entity.
 *
 * Both are undefined when useDrupalRoute() was called directly.
 */
type DrupalRouteHookEntity =
  | {
      [K in keyof DrupalRouteQueries]: {
        /**
         * The name of the route query in the drupalRoute.routeQueries option.
         */
        queryName: K

        /**
         * The entity of the route, undefined with noError when there is none.
         */
        entity?: DrupalRouteQueries[K]
      }
    }[keyof DrupalRouteQueries]
  | {
      queryName?: undefined
      entity?: undefined
    }

export type DrupalRouteHookPayload = {
  /**
   * The Nuxt route path for which the useDrupalRoute composable was called.
   */
  path: string
  drupalRoute?: DrupalRoute

  /**
   * The response of the query, including the fields of the
   * drupalRoute.queryFragments option.
   */
  routeQuery?: UseDrupalRouteFragment | null
  metatags: DrupalRouteMetatags
} & DrupalRouteHookEntity

/**
 * The route query of useDrupalRouteQuery().
 */
export type DrupalRouteQuery = {
  name: keyof DrupalRouteQueries

  /**
   * The object types of the entities the route query accepts, null for any.
   */
  entityTypes: string[] | null
}

export type UseDrupalRouteQueryInput =
  | UseDrupalRouteFragment
  | ComputedRef<UseDrupalRouteFragment | undefined | null>
  | Ref<UseDrupalRouteFragment | undefined | null>
  | undefined
  | null

export type DrupalRouteSetup<T> = {
  app: NuxtApp
  query: ComputedRef<UseDrupalRouteFragment | undefined | null>
  hookPayload: ComputedRef<DrupalRouteHookPayload>
  ctx: UseDrupalRoute<T | undefined>
}

type HandleOptions = {
  /**
   * Don't throw an error when the route has no entity.
   */
  noError?: boolean

  /**
   * Handle the route again when the query input changes (client only).
   */
  watch?: boolean
}

/**
 * Creates the reactive state of a Drupal route and adds its metatags.
 *
 * Calls composables, so it must run during setup, before any await: then the
 * metatags are removed when the component unmounts, and the Nuxt app is
 * available on the server without experimental.asyncContext.
 */
export function setupDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  providedRoute?: RouteLocationNormalizedLoaded,
  routeQuery?: DrupalRouteQuery,
): DrupalRouteSetup<T> {
  const app = useNuxtApp()

  const query = computed<UseDrupalRouteFragment | undefined | null>(() => {
    if (!queryInput) {
      return
    }

    if (queryInput !== null && 'value' in queryInput && queryInput.value) {
      return queryInput.value
    }

    if ('route' in queryInput) {
      return queryInput
    }
  })

  const metatags = computed<DrupalRouteMetatags>(() =>
    buildDrupalMetatags(query.value),
  )

  useHead(metatags)

  const entity = computed<T | undefined>(() => {
    const route = query.value?.route
    if (!route || !('entity' in route) || !route.entity) {
      return
    }

    // An entity that none of the fragments of the route query covers is
    // handled like a missing entity.
    const entityTypes = routeQuery?.entityTypes
    const typename = (route.entity as { __typename?: string }).__typename
    if (entityTypes && (!typename || !entityTypes.includes(typename))) {
      return
    }

    return route.entity as T
  })

  const drupalRoute = computed<DrupalRoute>(() => {
    const route = query.value?.route
    if (route && 'drupalRouteEntity' in route && route.drupalRouteEntity) {
      const entity = route.drupalRouteEntity
      return {
        name: route.routeName,
        entityBundle: entity.entityBundle,
        entityType: entity.entityTypeId,
        entityId: entity.id,
        entityUuid: entity.uuid,
      }
    } else if (route && 'routeName' in route) {
      return {
        name: route.routeName || undefined,
      }
    }

    return {}
  })

  const nuxtRoute = providedRoute ?? useRoute()

  const redirect = computed<string | undefined>(() => {
    const route = query.value?.route
    if (!route || !('redirect' in route) || !route.path) {
      return
    }

    // If the redirect already includes query parameters don't add the
    // current query params. Otherwise redirect to the path including the
    // current query parameters.
    return route.path.includes('?')
      ? route.path
      : withQuery(route.path, nuxtRoute.query)
  })

  const hookPayload = computed<DrupalRouteHookPayload>(
    () =>
      ({
        path: nuxtRoute.path,
        drupalRoute: drupalRoute.value,
        metatags: metatags.value,
        routeQuery: query.value,
        queryName: routeQuery?.name,
        entity: routeQuery ? entity.value : undefined,
      }) as DrupalRouteHookPayload,
  )

  return {
    app,
    query,
    hookPayload,
    ctx: {
      entity,
      drupalRoute,
      metatags,
      redirect,
    },
  }
}

/**
 * Redirects, throws the 404 error or calls the vuepal:drupal-route hook.
 *
 * Calls no composables, only the Nuxt app from setupDrupalRoute(), so it can
 * run after an await.
 */
export async function handleDrupalRoute<T>(
  setup: DrupalRouteSetup<T>,
  options: HandleOptions,
): Promise<UseDrupalRoute<T | undefined>> {
  const { app, query, hookPayload, ctx } = setup

  // Redirects are only handled once.
  if (query.value?.route && 'redirect' in query.value.route) {
    const target = ctx.redirect.value
    if (target) {
      const redirectCode = query.value.route.redirect?.statusCode ?? 301
      await app.runWithContext(() =>
        navigateTo(target, {
          redirectCode,
          replace: true,
          external: true,
        }),
      )
    }

    // Return the context immediately.
    return ctx
  }

  const handleRoute = async () => {
    // Check if Drupal returned a route and/or entity.
    // If it's missing, throw an error, unless the user requested not to throw.
    if ((!query.value?.route || !ctx.entity.value) && !options.noError) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found',
        fatal: true,
      })
    }

    // At this point we have an entity and the route can be rendered.
    // Implementors might still throw an error afterwards, e.g. when the route
    // belongs to an entity that is not supported in the frontend.
    await app.callHook('vuepal:drupal-route', hookPayload.value)
  }

  // Add a watcher, but only on client side. Registered before the first await,
  // so that it belongs to the component when called during setup.
  if (import.meta.client && options.watch) {
    watch(query, handleRoute)
  }

  await handleRoute()

  return ctx
}
