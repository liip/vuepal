import type { HookResult } from '@nuxt/schema'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { isRef } from '#imports'
import type { UseDrupalRoute } from './../../helpers/drupalRoute'
import {
  setupDrupalRoute,
  handleDrupalRoute,
  type DrupalRouteHookPayload,
  type UseDrupalRouteQueryInput,
} from './internal'

type Options = {
  /**
   * Don't throw error when route is not found.
   *
   * Use this for routes not serving an entity.
   */
  noError?: boolean
}

// Overload signature to make the return type nullable when setting noError to
// true, because it allows the composable to return if no route entity is
// available.
export function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options: { noError: true },
  providedRoute?: RouteLocationNormalizedLoaded,
): Promise<UseDrupalRoute<T | undefined>>

// Overload signature to make the return type non nullable without options or
// when the option noError is false, because the code ensures that the return
// type is always going to be the passed in generic type.
export function useDrupalRoute<T extends object = object>(
  queryInput: UseDrupalRouteQueryInput,
  options?: { noError?: false } | null,
  providedRoute?: RouteLocationNormalizedLoaded,
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
  options?: Options | null,
  providedRoute?: RouteLocationNormalizedLoaded,
): Promise<UseDrupalRoute<T | undefined>> {
  const setup = setupDrupalRoute<T>(queryInput, providedRoute)
  return handleDrupalRoute(setup, {
    noError: options?.noError,
    watch: isRef(queryInput),
  })
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    /**
     * Called inside useDrupalRoute if a valid Drupal route was found.
     */
    'vuepal:drupal-route': (data: DrupalRouteHookPayload) => HookResult
  }
}
