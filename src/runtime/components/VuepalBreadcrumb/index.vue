<template>
  <slot :links />
</template>

<script lang="ts" setup>
import { useBreadcrumb } from '#imports'
import type { BreadcrumbFragment } from '#graphql-operations'

const links = useBreadcrumb()

defineSlots<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default(props: { links: BreadcrumbFragment[] }): any
}>()
</script>
