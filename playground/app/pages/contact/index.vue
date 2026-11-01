<template>
  <div>
    <PageHeader />
    <NodePage v-if="entity" :title="entity.title" />
  </div>
</template>

<script setup lang="ts">
import {
  definePageMeta,
  useAsyncGraphqlQuery,
  useDrupalRoute,
  useRoute,
} from '#imports'
import { NodePage, PageHeader } from '#components'
import type { NodePageFragment } from '#graphql-operations'

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

// Uses its own query and useDrupalRoute() directly, with a ref as input.
const route = useRoute()
const { data } = await useAsyncGraphqlQuery(
  'route',
  { path: route.path },
  { transform: (v) => v.data },
)
const { entity } = await useDrupalRoute<NodePageFragment>(data)
</script>
