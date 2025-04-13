<template>
  <div style="padding-top: 200px">
    <Navbar />
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentLanguage } from '#imports'

const language = useCurrentLanguage()
</script>
