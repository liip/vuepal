---
name: vuepal-route-queries
description:
  "Drupal route queries in Nuxt with vuepal: the drupalRoute.routeQueries and
  queryFragments options, useDrupalRouteQuery(), useDrupalRoute() and the
  vuepal:drupal-route hook. Use when adding or changing a page that renders a
  Drupal entity or a frontend-routed page, adding a bundle or fragment to a
  route query, or writing a plugin for the hook; and when a page 404s, renders
  without its fields, redirects to the login form or keeps the previous page's
  metatags."
license: MIT
---

# vuepal route queries

The API is in the module's types and in the "Drupal Route" section of
`node_modules/vuepal/README.md`. This skill holds the rules that decide whether
a route renders, 404s or redirects, and where its data is available.

## How a route query works

Each entry in `drupalRoute.routeQueries` generates a GraphQL query `route<Name>`
(`nodePage` becomes `routeNodePage`) with a single variable, `$path`: the path
of the Nuxt route. The query spreads the `useDrupalRoute` fragment (route,
metatags, breadcrumb, language links and the `queryFragments`) and the entry's
`fragments` on the route's entity. `useDrupalRouteQuery(name)` runs it, adds the
metatags, then redirects, throws or calls the hook. The entity types each route
query accepts are in `entityTypes` of `.nuxt/vuepal-build/route-queries.js`
(`null` accepts any type).

| Drupal returns for the path                                 | Result                       |
| ----------------------------------------------------------- | ---------------------------- |
| An entity of a type that one of the fragments is on         | Renders, `entity` is set     |
| An entity of any other type                                 | 404                          |
| A redirect, or access denied (with the redirect module)     | Redirect, `entity` undefined |
| A Drupal route without an entity (e.g. a view), or no route | 404                          |
| A GraphQL or network error                                  | 500                          |

With `noError: true`, the page renders with `entity` undefined instead of the
404 and 500.

## Rules

1. **Give the route query a fragment for every entity type the page renders.** A
   catch-all page needs one per bundle, and a new bundle in Drupal is a 404
   until its fragment is added. A fragment on an interface such as `Node`
   accepts every type that implements it. Fragments are on types that implement
   `Entity`.
2. **A page that renders none of its node's fields gets a route query without
   fragments**, e.g. `routeOnly: {}`. It loads only the route (metatags,
   breadcrumb, language links), and its `entity` only has a `__typename`. A full
   fragment there loads the node and all its paragraphs for nothing.
3. **Pass `noError: true` where Drupal can have no entity for the path**, e.g. a
   frontend-routed page (`drupalFrontendRoute: true`) that no node is assigned
   to. The template handles the undefined `entity`.
4. **Render the redirect state.** On a redirect, `entity` is undefined, also
   without `noError`. The server sends an HTTP redirect; in the browser the
   redirect is asynchronous and the page renders meanwhile, or stays when the
   target is a download. Show a message with a link to `redirect`.
5. **Narrow the entity by `__typename` or by a field**:
   `entity.value?.__typename === 'NodePage'`, `'lead' in entity.value`. Every
   entity has a `__typename`, also when its fragment doesn't select it. A cast
   such as `as any` hides a missing fragment.
6. **Put logic that every route needs in a `vuepal:drupal-route` hook**, in a
   plugin, with the typed payload: `queryName` and `entity` (narrow by either),
   `routeQuery` (the whole response), `drupalRoute` and `metatags`. The hook
   runs when the route renders, so not on a redirect or an error. A page that
   calls `useDrupalRoute()` with its own query passes no `queryName` and no
   `entity`.
7. **Load fields that every page needs with `drupalRoute.queryFragments`**:
   fragments on `Query`, e.g. one that selects `messengerMessages`, read in the
   hook from `routeQuery`. Route queries declare only `$path`; data that needs
   other variables, or values from the route query's response, gets its own
   query.
8. **Render route data in the page or a component inside it.** During server
   rendering, the layout renders before the page's async setup has resolved, so
   a breadcrumb or language switch in the layout renders empty.
9. **Await in the page's `<script setup>`.** Vue restores the component after an
   `await` in `<script setup>`, so `useDrupalRoute(data)` after
   `await useAsyncGraphqlQuery()` works there. In a composable, everything after
   an `await` runs outside the component: on the server it needs
   `experimental.asyncContext`, and in the browser the previous page's metatags
   stay after navigation. A composable calls every composable before its first
   `await`.
10. **Keep vuepal's document names free:** the fragments `useDrupalRoute`,
    `metatag`, `schemaMetatag`, `breadcrumb`, `languageSwitchLink`,
    `adminMenuLink` and `localTask`, the queries `adminToolbar` and
    `localTasks`, and `route<Name>` for every route query. A project document
    with the same name silently replaces vuepal's or loses to it, depending on
    the nuxt-graphql-middleware version and the file order. For other breadcrumb
    or language link fields, set `addFragment: false` on the `breadcrumb` or
    `languageSwitchLinks` feature and define the fragment under vuepal's name,
    with at least the fields of vuepal's version in
    `node_modules/vuepal/dist/runtime/graphql/`.

## Check it

For every changed page, load a path of each entity type it renders, once
directly (server-rendered) and once by client-side navigation from another page.
A catch-all page also gets a path of a type it doesn't render.

Done when each path renders its fields with Drupal's title and description, the
page of an unrendered type is a 404, and every changed hook received the
expected `queryName`.

When a page 404s, renders without its fields or behaves otherwise unexpectedly,
go through [troubleshooting](references/troubleshooting.md).
