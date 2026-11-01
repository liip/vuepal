<template>
  <div>
    <PageHeader />
    <NodePage v-if="entity" :title="entity.title" />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta, useDrupalRouteQuery } from '#imports'
import { NodePage, PageHeader } from '#components'

// The frontendRouting feature writes this route to frontend_routing.settings,
// Drupal assigns a node and its aliases to it.
definePageMeta({
  name: 'contact-page',
  drupalFrontendRoute: true,
  path: '/kontakt',
  languageMapping: {
    en: '/contact-us',
  },
})

const { entity } = await useDrupalRouteQuery('nodeCanonical')
</script>
