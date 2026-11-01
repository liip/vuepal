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
      },
    },
  },
})
```

This will generate three route queries. They can be used with
`useDrupalRouteQuery`:

```ts
const { entity } = await useDrupalRouteQuery('slug')
```

Behind the scenes, this will call `useGraphqlQuery` and `useDrupalRoute`.

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
