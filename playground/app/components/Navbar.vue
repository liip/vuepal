<template>
  <nav class="navbar">
    <ul>
      <li v-for="(link, i) in menuLinks" :key="i">
        <NuxtLink :to="link.url">{{ link.label }}</NuxtLink>
      </li>

      <li>
        <NuxtLink :to="{ name: 'contact-page' }">Contact</NuxtLink>
      </li>
      <li>
        <NuxtLink :to="{ name: 'search' }">Search</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useInitData } from '#imports'

const { menuLinks } = await useInitData()
</script>
