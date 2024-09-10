<template>
  <div>
    <h1>{{ route.path }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from '#imports'

const route = useRoute()
</script>
