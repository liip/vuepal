<template>
  <div>
    <h1>{{ route.path }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useDrupalRouteQuery, useRoute } from '#imports'

const route = useRoute()

const { entity } = await useDrupalRouteQuery('nodeCanonical')
</script>
