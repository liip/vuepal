import type { BreadcrumbFragment } from '#graphql-operations'

export type QueryWithBreadcrumb = {
  route?:
    | {
        breadcrumb?: BreadcrumbFragment[] | null
      }
    | null
    | object
}

/**
 * Extract the breadcrumb from a route query.
 *
 * @see ~/pages/[language]/[...slug]/query.route.graphql
 */
export function getBreadcrumbFromRouteQuery(
  routeQuery?: QueryWithBreadcrumb | null,
): BreadcrumbFragment[] {
  if (routeQuery && routeQuery.route && 'breadcrumb' in routeQuery.route) {
    return routeQuery.route.breadcrumb || []
  }
  return []
}
