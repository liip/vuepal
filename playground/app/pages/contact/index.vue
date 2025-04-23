<template>
  <div>
    <h1>This is the contact page, a static node asdf.</h1>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  name: 'contact-page',
  drupalFrontendRoute: true,
  path: '/kontakt',
  languageMapping: {
    en: '/contact-us',
  },
})
</script>
