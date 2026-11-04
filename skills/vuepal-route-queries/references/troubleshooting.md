# Troubleshooting

Start with the response of the route query: in the browser's network tab after a
client-side navigation, or with
`GET /api/graphql_middleware/query/route<Name>?path=<path>` (the default
prefix). The path includes the language prefix, e.g. `/de/ueber-uns`.

## A page is a 404

Check in this order; the first match is usually the cause.

1. **`route` is `null`:** Drupal has no route for the path, e.g. no alias in
   that language. A page the user may not see is a 404 as well when the redirect
   module isn't installed.
2. **`route.__typename` is neither `EntityCanonicalUrl` nor
   `DefaultEntityUrl`:** a Drupal route without an entity. Only entity routes
   render.
3. **The entity's `__typename` is missing from `entityTypes`** of that route
   query in `.nuxt/vuepal-build/route-queries.js`: add a fragment for the type.
   A bundle that the GraphQL server doesn't expose comes back as
   `<EntityType>Unexposed`, e.g. `NodeUnexposed`: enable the bundle in the
   server's configuration first.

## A page renders without its fields

- **`noError: true` hides the 404** of an entity type without a fragment, so
  `entity` is undefined.
- **A cast hides a wrong type**, e.g. `entity as NodePageFragment` on a page
  that receives articles. Narrow by `__typename` instead.
- **A fragment with the same name** in the project replaced the one the page
  expects, or lost to vuepal's. Above each fragment's type in
  `.nuxt/graphql-operations/index.d.ts`, the `@see` comment names the file that
  was used.

## A 500 page

The route query failed: a GraphQL error, or Drupal wasn't reachable. The error's
message is the status message of the page; the GraphQL errors are in the Nuxt
server log.

## The page redirects to the login form

The path exists, but the user has no access, e.g. an unpublished node. With the
redirect module, graphql_core_schema returns a redirect to
`/user/login?destination=<path>` with status 403. The server responds with the
403 and a meta refresh that takes the browser to the form.

## The previous page's metatags stay after navigation

`useDrupalRoute()` or `useHead()` runs after an `await` inside a composable,
outside the component. Call them before the first `await`, or move the `await`
into the page's `<script setup>`.

## The breadcrumb or the language links are empty on the server

They are rendered in the layout, which renders before the page's async setup.
Render them in the page or in a component inside it.

## The hook has no `queryName` or `entity`

The page calls `useDrupalRoute()` with its own query; only
`useDrupalRouteQuery()` passes them.

## Old values of a queryFragments field reappear

With the client cache of nuxt-graphql-middleware enabled
(`graphqlMiddleware.clientCache.enabled`), a page the user returns to gets the
cached response, including fields such as `messengerMessages`. Pass
`clientCache: false` to `useDrupalRouteQuery()` on those pages.

## GraphQL errors during the build

- **`Variable "$x" is not defined by operation "routeX"`:** a fragment in
  `fragments` or `queryFragments` uses a variable. Route queries declare only
  `$path`.
- **`Fragment "x" cannot be spread here`:** a fragment in `fragments` is on a
  type that doesn't implement `Entity`, or one in `queryFragments` isn't on
  `Query`.
