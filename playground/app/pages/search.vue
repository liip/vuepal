<template>
  <div>
    <PageHeader />
    <h1 class="search-page">The search page.</h1>
  </div>
</template>

<script lang="ts" setup>
import { definePageMeta, useDrupalRouteQuery } from '#imports'

definePageMeta({
  name: 'search',
  drupalFrontendRoute: true,
  path: '/suche',
  languageMapping: {
    en: '/search',
  },
})

// No node is assigned to this route in Drupal, so there is no entity.
await useDrupalRouteQuery('nodeCanonical', { noError: true })
</script>
