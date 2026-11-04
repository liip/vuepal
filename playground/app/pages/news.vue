<template>
  <div>
    <PageHeader />
    <h1 class="news-page">The news page.</h1>
  </div>
</template>

<script lang="ts" setup>
import { definePageMeta, useDrupalRouteQuery } from '#imports'

definePageMeta({
  name: 'news-page',
  drupalFrontendRoute: true,
  path: '/neuigkeiten',
  languageMapping: {
    en: '/news',
  },
})

// The page renders none of the fields of its node. The route query without
// fragments only loads the route: metatags, breadcrumb and language links.
await useDrupalRouteQuery('routeOnly')
</script>
