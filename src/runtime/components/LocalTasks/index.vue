<template>
  <div class="vuepal-local-tasks">
    <ul>
      <li
        v-for="task in tasks"
        :key="task.key"
        :data-route-name="task.routeName"
      >
        <a
          :href="task.href"
          :class="{ 'vp-is-active': task.href === route.path }"
          >{{ task.title }}</a
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, computed, useLazyAsyncData } from '#imports'
import adapter from '#vuepal/adapter'
import type { LocalTask } from '#vuepal/types'
import { nonNullable } from '../../helpers/type'

const route = useRoute()
const language = adapter.getCurrentLanguage()

const props = defineProps<{
  pathOverride?: string
}>()

if (!adapter.getLocalTasks) {
  throw new Error(
    '<VuepalLocalTasks> was rendered, but getLocalTasks() adapter method is not implemented.',
  )
}

const path = computed(() => props.pathOverride || route.path)

const { data } = await useLazyAsyncData(
  'localTasks:' + path.value,
  () => adapter.getLocalTasks!(path.value),
  { watch: [path, language] },
)

const tasks = computed(() =>
  (data.value || [])
    .map((v, i) => {
      if (v && v.url.path && v.title) {
        return {
          href: v.url.path,
          title: v.title,
          key: i.toString(),
          routeName: getRouteName(v),
        }
      }
      return null
    })
    .filter(nonNullable),
)

function getRouteName(task: LocalTask): string {
  const url = task.url
  return url && 'routeName' in url ? url.routeName || '' : ''
}
</script>
