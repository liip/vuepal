import type { BreadcrumbFragment } from '#graphql-operations'
import { type ComputedRef, computed, useState } from '#imports'
import {
  type QueryWithBreadcrumb,
  getBreadcrumbFromRouteQuery,
} from './../../helpers/breadcrumb'

/**
 * Returns the reactive breadcrumb.
 */
export function useBreadcrumb(): ComputedRef<BreadcrumbFragment[]>

/**
 * Update the breadcrumb.
 */
export function useBreadcrumb(
  v: BreadcrumbFragment[] | QueryWithBreadcrumb | undefined | null,
): void

/**
 * Get or set the breadcrumb.
 */
export function useBreadcrumb(
  v?: BreadcrumbFragment[] | QueryWithBreadcrumb | null,
): void | ComputedRef<BreadcrumbFragment[]> {
  const state = useState<BreadcrumbFragment[]>('breadcrumbLinks', () => [])
  if (v === undefined) {
    return computed(() => state.value)
  } else if (Array.isArray(v)) {
    state.value = v
  } else {
    state.value = getBreadcrumbFromRouteQuery(v)
  }
}
