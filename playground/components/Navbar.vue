<template>
  <div>
    <ul>
      <li v-for="(link, i) in menuLinks" :key="i">
        <NuxtLink :to="link.url">{{ link.label }}</NuxtLink>
      </li>

      <li>
        <NuxtLink :to="{ name: 'contact-page' }">Contact</NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useInitData, useCurrentLanguage } from '#imports'

const { menuLinks } = await useInitData()
const language = useCurrentLanguage()
</script>
