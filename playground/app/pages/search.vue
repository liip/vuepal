<template>
  <div>The search page.</div>
</template>

<script lang="ts" setup>
import { definePageMeta } from '#imports'

definePageMeta({
  name: 'search',
  drupalFrontendRoute: true,
  languageMapping: {
    de: '/de/suche',
    fr: '/fr/chercher',
    en: '/en/search',
  },
})
</script>
