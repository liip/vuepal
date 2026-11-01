<template>
  <article class="node-page">
    <h1>{{ title }}</h1>
  </article>
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

defineProps<NodePageFragment>()
</script>
