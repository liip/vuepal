<template>
  <div>The search page.</div>
</template>

<script lang="ts" setup>
import { definePageMeta } from '#imports'

definePageMeta({
  name: 'search',
  drupalFrontendRoute: true,
  path: '/suche',
  languageMapping: {
    en: '/search',
  },
})
</script>
