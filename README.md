# VuePal

VuePal provides a bridge between Drupal and Vue. It comes with a set of
components and composables to make your life easier when working with Drupal.

## Frontend Routing

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    frontendRouting: {
      enabled: true,
      langcodes: ['de', 'fr', 'en'],
      outputPath: './../drupal/config/default/frontend_routing.settings.yml',
    },
  },
})
```

With this feature enabled, you can create a static frontend page in Nuxt and
still use all the routing features of Drupal in your frontend application. You
can define your aliases in the frontend page using `definePageMeta`. The module
will automatically create a Drupal configuration file that can be imported and
processed by the
[Drupal frontend_routing](https://www.drupal.org/project/frontend_routing)
module.

```ts [pages/static-page/example.vue]
definePageMeta({
  name: 'static-page-example',
  drupalFrontendRoute: true,
  languageMapping: {
    de: '/de/statisch',
    fr: '/fr/statique',
    en: '/en/static',
  },
})
```

## Drupal Route

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    drupalRoute: {
      enabled: true,
    },
  },
})
```

This option enables the `useDrupalRoute()` composable. This composable provides
the necessary GraphQL fragment and query to fetch the route data and metatags of
a Drupal page.

### useDrupalRouteQuery()

You can optionally also let Vuepal generate GraphQL route queries for you:

```ts
export default defineNuxtConfig({
  vuepal: {
    drupalRoute: {
      enabled: true,
      // The route queries that will be generated for useDrupalRouteQuery().
      routeQueries: {
        slug: { fragments: ['nodePage'] },
        nodePage: { fragments: ['nodePage'] },
        nodeCanonical: {
          fragments: ['nodeContact', 'nodePage', 'nodePressRelease'],
        },
        // Only the route: metatags, breadcrumb and language links.
        routeOnly: {},
      },
    },
  },
})
```

This will generate four route queries. They can be used with
`useDrupalRouteQuery`:

```ts
const { entity } = await useDrupalRouteQuery('slug')
```

Behind the scenes, this will call `useGraphqlQuery` and `useDrupalRoute`.

A route query only accepts entities of the types that its fragments are on. A
fragment on an interface such as `Node` accepts every type that implements it.
For an entity of another type, e.g. a node of a bundle without a fragment, the
composable throws a 404, or returns an undefined `entity` with `noError`. A
route query without fragments accepts entities of any type.

The `entity` always has a `__typename`, also when the fragment does not select
it:

```ts
const { entity } = await useDrupalRouteQuery('nodeCanonical')

if (entity.value?.__typename === 'NodePage') {
  // entity.value is a NodePageFragment.
}
```

#### Fields for every route

Fragments on `Query` in the `queryFragments` option are spread into the
`useDrupalRoute` fragment. This adds their fields to every route query, e.g. the
messages of the `graphql_messenger` module:

```graphql
fragment routeGlobal on Query {
  messengerMessages
}
```

```ts
export default defineNuxtConfig({
  vuepal: {
    drupalRoute: {
      enabled: true,
      queryFragments: ['routeGlobal'],
    },
  },
})
```

The fragments can't use variables other than `$path`. With the client cache of
nuxt-graphql-middleware enabled (`graphqlMiddleware.clientCache`), a page the
user returns to gets the fields from the cached response, unless
`useDrupalRouteQuery()` is called with `clientCache: false`.

#### The vuepal:drupal-route hook

`useDrupalRoute()` and `useDrupalRouteQuery()` call the hook when the route can
be rendered:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vuepal:drupal-route', (payload) => {
    // The fields of the queryFragments option.
    const messages = payload.routeQuery?.messengerMessages

    if (payload.queryName === 'nodeCanonical') {
      // payload.entity has the type of the nodeCanonical route query.
    }

    if (payload.entity && 'businessArea' in payload.entity) {
      // The entity of every fragment that selects businessArea.
    }
  })
})
```

`queryName` and `entity` are only set by `useDrupalRouteQuery()`.

#### Redirects

If Drupal returns a redirect for the path, the composable redirects to the
target and returns without throwing a 404, also when `noError` is not set. In
this case `entity` is `undefined`, so the page must not assume that it is set.

On the server the redirect is sent as an HTTP redirect. On the client the
browser follows it asynchronously, and the page is rendered in the meantime. If
the target is a file that the browser downloads, the browser stays on the page.
Use `redirect` to render a message with a link to the target:

```vue
<template>
  <div v-if="redirect">
    <p>You are being redirected.</p>
    <a :href="redirect">Continue</a>
  </div>
</template>

<script setup lang="ts">
const { entity, redirect } = await useDrupalRouteQuery('nodePage')
</script>
```

## Admin Toolbar

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    adminToolbar: {
      enabled: true,
    },
  },
})
```

The admin toolbar component fetches the Drupal administration menu and displays
it in your frontend application.
![toolbar.png](https://github.com/liip/vuepal/blob/main/screenshots/toolbar.png)

When the toolbar is too narrow for its links, the Drupal logo and a "Manage"
button replace them. The button is labeled in German, French or Italian when
that's the current language, and in English otherwise. It opens the links in a
sidebar, where every submenu can be expanded. So the toolbar doesn't have to be
hidden on small screens. On touch screens, the first tap on a link with a
submenu opens the submenu, and the second tap follows the link.

### Usage

```vue
<template>
  <ClientOnly>
    <div v-if="drupalUser.accessToolbar && !isEditing">
      <VuepalAdminToolbar :key="language" />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const route = useRoute()
const drupalUser = useDrupalUser()
const language = useCurrentLanguage()
const isEditing = computed(
  () =>
    !!(route.query.blokkliEditing || route.query.blokkliPreview) &&
    drupalUser.value.accessToolbar,
)
</script>
```

## LocalTasks

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    localTasks: {
      enabled: true,
    },
  },
})
```

The local tasks component fetches the local tasks of a Drupal page and displays
them in your frontend application.
![localtasks.png](https://github.com/liip/vuepal/blob/main/screenshots/localtasks.png)

```vue
<template>
  <ClientOnly>
    <div class="flex">
      <div class="mx-auto w-auto bg-white py-8 xl:min-w-[1174px]">
        <VuepalLocalTasks />
      </div>
    </div>
  </ClientOnly>
</template>
```

## Full Configuration

Example of a full VuePal configuration in the `nuxt.config.ts` file.

```ts
export default defineNuxtConfig({
  vuepal: {
    adminToolbar: {
      enabled: true,
    },
    localTasks: {
      enabled: true,
    },
    drupalRoute: {
      enabled: true,
    },
    frontendRouting: {
      enabled: true,
      langcodes: ['de', 'fr', 'en'],
      outputPath: './../drupal/config/default/frontend_routing.settings.yml',
    },
    devMode: {
      enabled: true,
      url: `https://${NUXT_REQUEST_HOST}`,
      forceHttps: true,
    },
  },
})
```

## Agent skill

The package ships an [agent skill](https://agentskills.io) in
`skills/vuepal-route-queries`. It teaches coding agents like Claude Code the
rules of route queries: which entity types a route query accepts, when a page
404s or redirects, where the route's data is available, and how to debug it. It
matches the installed version of the module.

To link it into your project:

- With pnpm 12.11 or newer, run `pnpm approve vuepal`. pnpm links the skills of
  approved direct dependencies when it installs them.
- With [skills-npm](https://github.com/antfu/skills-npm), run
  `npm i -D skills-npm` and `npx skills-npm setup`. It links the skills of your
  installed packages on every install.

Or copy the skill from GitHub with the
[skills CLI](https://github.com/vercel-labs/skills):
`npx skills add liip/vuepal`. This copy follows the main branch, not your
installed version.

## Development

The playground runs against a small Drupal site in `drupal/`, with
[ddev](https://ddev.com). Nuxt and Drupal share the host
`https://vuepal.ddev.site`: ddev's nginx sends Drupal's paths (GraphQL, login,
admin, node forms) to Drupal and everything else to Nuxt, which runs in the web
container.

```bash
ddev setup      # Install the Drupal site from scratch and prepare the module.
ddev frontend   # Start the playground's dev server.
```

Log in at `https://vuepal.ddev.site/de/user/login` with `admin` / `admin`.
Logged in users get the playground in SPA mode, like in projects based on the
blökkli starterkit.

The test site is defined by:

- `drupal/recipe/recipe.yml`: modules and configuration, including the GraphQL
  server. `frontend_routing.settings.yml` in the recipe is generated by the
  playground.
- `drupal/content.php`: the content the E2E tests rely on.

Run Node commands in the web container (`ddev npm run …`), since that is where
Nuxt runs.

To update `schema.graphql` from the test site:

```bash
ddev exec VUEPAL_DOWNLOAD_SCHEMA=1 npx nuxi prepare playground
npx prettier --write schema.graphql
```

### E2E tests

The [Playwright](https://playwright.dev) tests in `test/e2e` run on the host
against `https://vuepal.ddev.site`. Every test runs twice: rendered on the
server (`ssr` project) and as an SPA (`spa` project).

```bash
npx playwright install chromium   # Once.
ddev frontend                     # In a separate terminal.
npm run test:e2e
```

A production build can behave differently from the dev server, and CI tests the
build. Before pushing changes to runtime code, run the tests against both:

```bash
ddev frontend --build                # Builds and serves the playground.
VUEPAL_E2E_BUILD=1 npm run test:e2e
```

`VUEPAL_E2E_BUILD=1` has to match the server: some tests only apply to the build
or the dev server, and the tests fail early when the flag is wrong.
