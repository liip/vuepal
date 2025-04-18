import type { SerializableHead, Link } from '@unhead/vue'
import type { HookResult } from '@nuxt/schema'
import type { RouteLocationRaw } from 'vue-router'
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
} from '#imports'

type DrupalRouteMetatags = {
  title: string
  link: Link[]
  meta: Link[]
}

type Options = {
  /**
   * Don't throw error when route is not found.
   *
   * Use this for routes not serving an entity.
   */
  noError?: boolean
}

type DrupalRoute = {
  /**
   * The name of the route, e.g. "entity.node.canonical".
   */
  name?: string

  /**
   * The bundle of the entity, e.g. "page".
   */
  entityBundle?: string

  /**
   * The entity type, e.g. "node".
   */
  entityType?: string

  /**
   * The ID of the entity.
   */
  entityId?: string

  /**
   * The UUID of the entity.
   */
  entityUuid?: string
}

type DrupalRouteHookPayload = {
  drupalRoute?: DrupalRoute
  metatags: DrupalRouteMetatags
}

type UseDrupalRoute<T> = {
  /**
   * The user-specific fields for the entity, according to their fragment.
   */
  entity: ComputedRef<T>

  /**
   * The Drupal route information.
   */
  drupalRoute: ComputedRef<DrupalRoute>

  /**
   * The mapped meta tags.
   */
  metatags: ComputedRef<SerializableHead>
}

type UseDrupalRouteQueryInput =
  | UseDrupalRouteFragment
  | ComputedRef<UseDrupalRouteFragment | undefined | null>
  | Ref<UseDrupalRouteFragment | undefined | null>
  | undefined
  | null

// Overload signature to make the return type nullable when setting noError to
// true, because it allows the composable to return if no route entity is
// available.
export function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options: { noError: true },
): Promise<UseDrupalRoute<T | undefined>>

// Overload signature to make the return type non nullable without options or
// when the option noError is false, because the code ensures that the return
// type is always going to be the passed in generic type.
export function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options?: { noError?: false },
): Promise<UseDrupalRoute<T>>

/**
 * Composable that handles the Drupal routing for 404, redirects, metatags and
 * entities.
 *
 * The composable must be called directly in the top level of the <script
 * setup> code.
 */
export async function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options?: Options,
): Promise<UseDrupalRoute<T | undefined>> {
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

  const metatags = computed<DrupalRouteMetatags>(() => {
    const route = query.value?.route
    if (route && 'metatags' in route) {
      return buildDrupalMetatags(route.metatags)
    }
    return { link: [], meta: [], title: '', schema: '' }
  })

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

  const hookPayload = computed<DrupalRouteHookPayload>(() => ({
    drupalRoute: drupalRoute.value,
    metatags: metatags.value,
  }))

  const nuxtRoute = useRoute()

  const handleRoute = async () => {
    // Handle redirects first.
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

      return
    }

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
    await app.callHook('drupal-route', hookPayload.value)
  }

  // Add a watcher, but only on client side.
  if (import.meta.client) {
    watch(query, handleRoute)
  }

  await handleRoute()

  return {
    entity,
    drupalRoute,
    metatags,
  }
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'drupal-route': (data: DrupalRouteHookPayload) => HookResult
  }
}
