# Upgrade Nodes for VuePal 3.0

VuePal 3.0 comes with a lot of new features and improvements. This document outlines the changes and how to upgrade your
existing VuePal setup to the latest version.

VuePal 3.0 is meant to be used with Nuxt > 3.17 and with the following modules:

- [Nuxt GraphQL Middleware](https://nuxt.com/modules/nuxt-graphql-middleware) > 5.0.0
- [Nuxt Language Negotiation](https://github.com/dulnan/nuxt-language-negotiation) > 2.0.0
- [Nuxt Easy Texts](https://github.com/dulnan/nuxt-easy-texts) > 2.0.0
- [Nuxt SVG Icon Sprite](https://github.com/dulnan/nuxt-svg-icon-sprite) > 2.0.0
- [NUxt Page Dependency](https://github.com/dulnan/nuxt-page-dependencies)  > 1.0.0

## Nuxt 4 compatibility

The VuePal module is compatible with Nuxt 4. The module will automatically detect the Nuxt version and work with
the new file structure.

## New `useDrupalRouteQuery` composable

This is the most important change in VuePal 3.0. Instead of creating a GraphQL query for each route, you can now use the
`useGraphqlRoute()` composable to fetch the route data dynamically. You can define the routeQueries and the related
fragments in the VuePal configuration in the `nuxt.config.ts` file.

### Old behavior in VuePal 2.0:

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

### New dynamic route queries

Define the route queries in the `nuxt.config.ts` file. Here you need to specify the fragments that this route
query will use. The`useDrupalRouteQuery()` composable will automatically generate the GraphQL query and extract the
entity.

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

## Adapted route definition in `definePageMeta`

The route definition in definePageMeta() has been simplified.

- The path property is used for the alias of the default language.
- The aliases no longer have a language prefix. This will be automatically determined by the Nuxt Language Negotiation
  module.

**Before:** `pages/static-page/example.vue`

```ts
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

**After:** `pages/static-page/example.vue`

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

## Removal of the `pluginOrder` module

This module is no longer needed as Nuxt 3 now has a solution to properly order the plugins.

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

After:
Use the `dependsOn` feature of Nuxt 3 to define plugin order.

```ts [app/plugins/initData.ts]
export default defineNuxtPlugin({
  name: 'starterkit:init-data',
  dependsOn: [
    'nuxt-graphql-middleware-provide-state',
    'starterkit:graphql-plugin',
    'nuxt:router',
  ],
  async setup() {
  }
})
```

## New type in `vuepal.adapter.ts`

Before:

```ts
import { defineVuepalAdapter } from '#vuepal/types'
```

After:

```ts
import { defineVuepalAdapter } from 'vuepal/adapter'
```

## Trusted origin plugin

This plugin adds client side protection against proxy attacks. It checks the domain, the website is running on.
If the domain is not in the trusted origins, it will throw a random error. Enable it, if you want to protect your
application against scammers.

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

The language switcher has been reworked and depends on the 2.0 version of the [Nuxt
Language Negotiation](https://github.com/dulnan/nuxt-language-negotiation) module.

It is now fully reactive and will update all links and translations, based on the selected
language. It is no longer necessary to call `setLanguageLinksFromRoute` manually.

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

A new breadcrumb component (VuepalBreadcrumb) is available. If you place it outside the page component, it will
automatically care about passing the data from the routeQuery. A composable is no longer needed to fetch the data.

Enable the breadcrumb component by adding the following in the `nuxt.config.ts` file:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  vuepal: {
    breadcrumb: {
      enabled: true,
    },
  },
})
```
