# Upgrade Nodes for Vuepal 3.0

Vuepal 3.0 comes with a lot of new features and improvements. This document
outlines the changes and how to upgrade your existing Vuepal setup to the latest
version.

Version 3.0 is meant to be used with Nuxt > 3.17 and with the latest versions of
these modules:

| Module                    | Version | Upgrade Guide                                                                    |
| ------------------------- | ------- | -------------------------------------------------------------------------------- |
| nuxt-graphql-middleware   | 5.1.0   | https://github.com/dulnan/nuxt-graphql-middleware/releases/tag/release%2F5.0.0   |
| nuxt-language-negotiation | 2.0.0   | https://github.com/dulnan/nuxt-language-negotiation/releases/tag/release%2F2.0.0 |

When using the "blökkli Starterkit", you may also update
[nuxt-easy-texts](https://github.com/dulnan/nuxt-easy-texts) and
[nuxt-svg-icon-sprite](https://github.com/dulnan/nuxt-svg-icon-sprite), though
they don't have any dependency with Vuepal.

## Nuxt 4 compatibility

The Vuepal module is compatible with Nuxt 4. The module will automatically
detect the Nuxt version and work with the new file structure. We recommend
already switching to this
[new folder structure](https://nuxt.com/docs/getting-started/upgrade#new-directory-structure).

## Automatic Registration of Fragments

A new feature in nuxt-graphql-middleware allows other modules to automatically
register GraphQL documents. Vuepal also uses this for its fragments and queries.

This means you can remove any imports from `autoImportPatterns` in the config of
nuxt-graphql-middleware.

### Before

```ts
export default defineNuxtConfig({
  graphqlMiddleware: {
    autoImportPatterns: [
      'pages/**/*.{gql,graphql}',
      'components/**/*.{gql,graphql}',
      '!node_modules',
      'node_modules/vuepal/dist/runtime/components/AdminToolbar/query.adminToolbar.graphql',
      'node_modules/vuepal/dist/runtime/components/LocalTasks/query.localTasks.graphql',
      'node_modules/vuepal/dist/runtime/composables/useDrupalRoute/fragment.drupalRoute.graphql',
    ],
  },
})
```

### After

```ts
export default defineNuxtConfig({
  graphqlMiddleware: {
    autoImportPatterns: [
      'pages/**/*.{gql,graphql}',
      'components/**/*.{gql,graphql}',
    ],
  },
})
```

## Schema-based fragments and queries

The module will now query the GraphQL schema to determine which types and fields
exist. Based on that, it will dynamically add or remove certain features.

For example, if you enable the `graphql_metatag_schema_org_schema` Drupal module
and the `metatags_schema_org` GraphQL extension, Vuepal will automatically query
the `schemaOrgMetatags` field in route queries and set the schema.org metatags
automatically. This also applies for `breadcrumb`, `languageSwitchLinks` and
`metatags`.

## New `useDrupalRouteQuery` composable

This is the most important change in Vuepal 3.0. Instead of creating a GraphQL
query for each route, you can now let Vuepal create them for your. You can
define the route queries in the configuration in your `nuxt.config.ts`.

This new feature is optional; the "old way" still works.

### Before

`pages/[...slug]/index.vue`

```vue
<template>
  <NodePage v-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

defineOptions({
  name: 'PageSlug',
})

definePageMeta({
  name: 'drupal-route',
  path: '/:slug(.*)*',
})

const nuxtRoute = useRoute()

// Get the data.
const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('route', {
    path: nuxtRoute.path,
  }).then((v) => {
    return v.data
  })
})

// Handles redirects and metatags.
const { entity: node } = await useDrupalRoute<NodePageFragment>(query.value)

setBreadcrumbLinksFromRoute(query.value)
setLanguageLinksFromRoute(query.value)
await renderPageDependencies()
</script>
```

### After

Define the route queries in the `nuxt.config.ts` file. Here you need to specify
which entity fragments the query should contain:

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
      },
    },
  },
})
```

Now you can use these three route queries using the new `useDrupalRouteQuery`
composable:

File: `pages/[...slug]/index.vue`

```vue
<template>
  <NodePage v-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
defineOptions({
  name: 'PageSlug',
})

definePageMeta({
  name: 'drupal-route',
  path: '/:slug(.*)*',
})

// Handles redirects and metatags.
const { entity: node } = await useDrupalRouteQuery('slug')

await renderPageDependencies()
</script>
```

Behind the scenes, Vuepal will basically just generate a GraphQL file and
register it in nuxt-graphql-middleware:

```graphql
query routeNodeCanonical($path: String!) {
  ...useDrupalRoute
  route(path: $path) {
    ... on EntityUrl {
      entity {
        __typename
        ...nodePage
        ...nodeContact
        ...nodePressRelease
      }
    }
  }
}
```

You can inspect all the generated GraphQL files in
`.nuxt/nuxt-graphql-middleware/hook-documents.graphql` or in the "GraphQL
Middleware" tab in Nuxt Dev Tools.

In addition, the return value of the composable will be fully typed:

```ts
const { entity } = await useDrupalRouteQuery('nodeCanonical')
```

`entity.value` will be typed as
`NodePageFragment | NodeContactFragment | NodePressReleaseFragment`.

## Adapted route definition in `definePageMeta`

The route definition in definePageMeta() has been simplified. This is a change
introduced in `nuxt-language-negotiation`.

- The **path** property is used for the alias of the **default language**.
- The languageMapping no longer needs a language prefix. This will be
  automatically determined.

### Before: `pages/static-page/example.vue`

```ts
definePageMeta({
  name: 'contact',
  drupalFrontendRoute: true,
  languageMapping: {
    de: '/de/kontakt',
    en: '/en/contact',
  },
})
```

### After: `pages/static-page/example.vue`

```ts
definePageMeta({
  name: 'static-page-example',
  drupalFrontendRoute: true,
  path: '/statisch',
  languageMapping: {
    fr: '/statique',
    en: '/static',
  },
})
```

## New types in `vuepal.adapter.ts`

The `defineVuepalAdapter` method can now be imported directly from the package.

### Before

```ts
import { defineVuepalAdapter } from '#vuepal/types'
```

### After

```ts
import { defineVuepalAdapter } from 'vuepal/adapter'
```

## Trusted origin plugin

This plugin adds client side protection against proxy attacks. It checks the
domain, the website is running on. If the domain is not in the trusted origins,
it will throw a random error. Enable it, if you want to protect your application
against scammers.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    trustedOrigins: {
      enabled: true,
      origins: ['https://yourtrustedorigin.com'],
    },
  },
})
```

## Language Switcher

The language switcher has been reworked and depends on the 2.0 version of the
[Nuxt Language Negotiation](https://github.com/dulnan/nuxt-language-negotiation)
module.

It is now fully reactive and will update all links and translations, based on
the selected language. It is no longer necessary to call
`setLanguageLinksFromRoute` manually, if your page calls `useDrupalRoute` or
`useDrupalRouteQuery`.

This new feature needs to be enabled:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    languageSwitchLinks: {
      enabled: true,
    },
  },
})
```

You can then remove `setLanguageLinksFromRoute` and related composables from
your project's code.

New types / imports:

```ts
import type { Langcode } from '#nuxt-language-negotiation/config'
import { defaultLangcode, langcodes } from '#nuxt-language-negotiation/config'
```

Before:

```ts
import type { PageLanguage } from '#language-negotiation/language'
import { defaultLangcode, langcodes } from '#language-negotiation/language'
```

## Breadcrumb component

A new breadcrumb component (VuepalBreadcrumb) is available. If you place it
outside the page component, it will automatically care about passing the data
from the routeQuery. You can remove existing breadcrumb-related components from
your project's code.

Enable the breadcrumb component by adding the following in the `nuxt.config.ts`
file:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    breadcrumb: {
      enabled: true,
    },
  },
})
```

Now, whenever you use `useDrupalRoute` or `useDrupalRouteQuery` in a page,
Vuepal will handle updating the breadcrumb state.

You can then access the breadcrumb links either using `useBreadcrumb()` or via
`<VuepalBreadcrumb>`:

```vue
<template>
  <div>
    <NuxtPageDependency>
      <VuepalBreadcrumb v-slot="{ links }">
        <Breadcrumb :links />
      </VuepalBreadcrumb>
    </NuxtPageDependency>
  </div>
</template>
```

## Hooking into `useDrupalRoute`

If you want to alter some additional app state whenever `useDrupalRoute` or
`useDrupalRouteQuery` is called, you can do so by hooking into the
`vuepal:drupal-route` hook. This is in fact how the `breadcrumb` and
`languageSwitchLinks` feature also work:

```ts
import type { BreadcrumbFragment } from '#graphql-operations'
import { getBreadcrumbFromRouteQuery } from '#vuepal/helpers/breadcrumb'

/**
 * Manages the breadcrumb state.
 */
export default defineNuxtPlugin({
  name: 'vuepal:breadcrumb',
  setup(app) {
    const state = useState<BreadcrumbFragment[]>('breadcrumbLinks', () => [])

    // Called by useDrupalRoute.
    app.hooks.hook('vuepal:drupal-route', (data) => {
      state.value = getBreadcrumbFromRouteQuery(data.routeQuery)
    })
  },
})
```

The hook is called after every non-error route query.

## Optional (when using blökkli starterkit)

### Removal of the `pluginOrder` module

This module is no longer needed as Nuxt 3 now has a solution to properly order
the plugins.

Before:

```ts [nuxt.config.ts]
  pluginOrder: {
  order: [
    // Match plugins by their file path.
    // Note that only a single plugin may match.
    // The match is performed as "plugin.src.includes(v.pathMatch)".
    { pathMatch: 'plugins/language.ts' },
    { pathMatch: 'myother/plugin.ts' },
  ],
    logSortedPlugins
:
  false,
}
```

After: Use the `dependsOn` feature of Nuxt 3 to define plugin order.

```ts [app/plugins/initData.ts]
export default defineNuxtPlugin({
  name: 'starterkit:init-data',
  dependsOn: [
    'nuxt-graphql-middleware-provide-state',
    'starterkit:graphql-plugin',
    'nuxt:router',
  ],
  async setup() {},
})
```
