<template>
  <div>
    <h1>This is the contact page, a static node asdf.</h1>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  name: 'contact-page',
  meta: {
    drupalFrontendRoute: true,
  },
  languageMapping: {
    de: '/de/kontakt',
    fr: '/fr/contactez-nous',
    en: '/en/contact-us',
    it: '/it/conatactio',
  },
})
</script>
