import type { HookResult } from '@nuxt/schema'
import type {
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import type { UseDrupalRouteFragment } from '#graphql-operations'
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
  isRef,
} from '#imports'
import type { DrupalRoute, UseDrupalRoute } from './../../helpers/drupalRoute'
import type { DrupalRouteMetatags } from '../../types/metatags'

type Options = {
  /**
   * Don't throw error when route is not found.
   *
   * Use this for routes not serving an entity.
   */
  noError?: boolean
}

type DrupalRouteHookPayload = {
  /**
   * The Nuxt route path for which the useDrupalRoute composable was called.
   */
  path: string
  drupalRoute?: DrupalRoute
  routeQuery?: UseDrupalRouteFragment | null
  metatags: DrupalRouteMetatags
}

type UseDrupalRouteQueryInput =
  | UseDrupalRouteFragment
  | ComputedRef<UseDrupalRouteFragment | undefined | null>
  | Ref<UseDrupalRouteFragment | undefined | null>
  | undefined
  | null

/**
 * Composable that handles the Drupal routing for 404, redirects, metatags and
 * entities.
 *
 * The composable must be called directly in the top level of the <script
 * setup> code.
 */
export async function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options?: Options | null,
  providedRoute?: RouteLocationNormalizedLoaded,
): Promise<UseDrupalRoute<T | undefined>> {
  const app = useNuxtApp()
  const inputIsRef = isRef(queryInput)

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

  const entity = computed<T | undefined>(() =>
    query.value?.route &&
    'entity' in query.value.route &&
    query.value.route.entity
      ? (query.value.route.entity as T)
      : undefined,
  )

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

  const ctx: UseDrupalRoute<T | undefined> = {
    entity,
    drupalRoute,
    metatags,
  }

  const nuxtRoute = providedRoute ?? useRoute()

  const hookPayload = computed<DrupalRouteHookPayload>(() => ({
    path: nuxtRoute.path,
    drupalRoute: drupalRoute.value,
    metatags: metatags.value,
    routeQuery: query.value,
  }))

  // Redirects are only handled once.
  if (query.value?.route && 'redirect' in query.value.route) {
    const redirectTarget = query.value.route.path
    if (redirectTarget) {
      // If the redirect already includes query parameters don't add the
      // current query params. Otherwise redirect to the path including the
      // current query parameters.
      const target: RouteLocationRaw = redirectTarget.includes('?')
        ? redirectTarget
        : {
            path: redirectTarget,
            query: nuxtRoute.query,
          }

      await navigateTo(target, {
        redirectCode: query.value.route.redirect?.statusCode ?? 301,
        replace: true,
        external: true,
      })
    }

    // Return the context immediately.
    return ctx
  }

  const handleRoute = async () => {
    // Check if Drupal returned a route and/or entity.
    // If it's missing, throw an error, unless the user requested not to throw.
    if ((!query.value?.route || !entity.value) && !options?.noError) {
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

  // Add a watcher, but only on client side.
  if (import.meta.client && inputIsRef) {
    watch(query, handleRoute)
  }

  await handleRoute()

  return ctx
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    /**
     * Called inside useDrupalRoute if a valid Drupal route was found.
     */
    'vuepal:drupal-route': (data: DrupalRouteHookPayload) => HookResult
  }
}
