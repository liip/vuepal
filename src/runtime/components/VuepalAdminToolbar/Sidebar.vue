<template>
  <ul
    class="vuepal-admin-toolbar-sidebar-list"
    :style="{ '--vp-level': level }"
  >
    <template v-for="(item, i) in links" :key="i">
      <li v-if="item.link">
        <div class="vuepal-admin-toolbar-sidebar-row">
          <a
            class="vuepal-admin-toolbar-sidebar-link"
            :href="item.link.url?.path || ''"
            :data-route-name="item.link.url?.routeName"
          >
            <span
              v-if="level === 0"
              class="vuepal-admin-toolbar-icon"
              :style="{
                'mask-image': `url(${getIconPath(item.link.url?.routeName)})`,
              }"
            />
            <span class="vuepal-admin-toolbar-text">{{ item.link.label }}</span>
          </a>
          <button
            v-if="item.subtree?.length"
            type="button"
            class="vuepal-admin-toolbar-sidebar-toggle"
            :aria-expanded="open === i"
            :aria-label="item.link.label || ''"
            @click="open = open === i ? -1 : i"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="m8 20 8-8-8-8"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <AdminToolbarSidebar
          v-if="open === i && item.subtree?.length"
          :links="item.subtree"
          :level="level + 1"
        />
      </li>
    </template>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from '#imports'
import { adminToolbarIcons } from '#vuepal-build/admin-config'
import type { AdminMenuLinkFragment } from './../../types'

defineOptions({
  name: 'AdminToolbarSidebar',
})

withDefaults(
  defineProps<{
    links: AdminMenuLinkFragment[]
    level?: number
  }>(),
  { level: 0 },
)

// Like an accordion: one open submenu per list.
const open = ref(-1)

function getIconPath(routeName: string | null | undefined) {
  return (
    (routeName && adminToolbarIcons[routeName]) || adminToolbarIcons.fallback
  )
}
</script>
