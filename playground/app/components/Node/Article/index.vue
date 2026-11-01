<template>
  <article class="node-article">
    <h1>{{ title }}</h1>
    <p class="lead">{{ lead }}</p>
  </article>
</template>

<script lang="ts" setup>
import type { NodeArticleFragment } from '#graphql-operations'

defineProps<Pick<NodeArticleFragment, 'title' | 'lead'>>()
</script>
