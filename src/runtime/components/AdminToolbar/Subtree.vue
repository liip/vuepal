<template>
  <li v-if="link">
    <a
      class="vuepal-admin-toolbar-link"
      :class="{ 'vp-is-first': level === 0 }"
      :href="link.url?.path || ''"
      :data-route-name="routeName"
      @mouseover="onMouseOver"
      @mouseleave="onMouseLeave"
    >
      <span v-if="style" class="vuepal-admin-toolbar-icon" :style="style" />
      <span class="vuepal-admin-toolbar-text">{{ link!.label }}</span>

      <svg
        v-if="subtree && subtree.length && level > 0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
      >
        <path
          d="M8.053 8.355c.193-.195.193-.517 0-.711l-3.26-3.289c-.193-.195-.192-.514.002-.709l1.371-1.371c.194-.194.512-.193.706.001l5.335 5.369c.195.195.195.515 0 .708l-5.335 5.37c-.194.192-.512.193-.706.002l-1.371-1.371c-.194-.195-.195-.514-.002-.709l3.26-3.29z"
        />
      </svg>
    </a>
    <ul v-if="subtree && subtree.length && active">
      <AdminToolbarSubtree
        v-for="(subLink, i) in subtree"
        :key="i"
        :level="level + 1"
        :active="localActive === i"
        :link="subLink.link"
        :subtree="
          'subtree' in subLink && subLink.subtree ? subLink.subtree : undefined
        "
        @hover="localActive = i"
      />
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from '#imports'
import { adminToolbarIcons } from '#vuepal/admin-config'
import type { AdminMenuLinkFragment } from '#vuepal/types'

defineOptions({
  name: 'AdminToolbarSubtree',
})

const props = withDefaults(
  defineProps<{
    level?: number
    link?: AdminMenuLinkFragment['link']
    subtree?: AdminMenuLinkFragment['subtree']
    active: boolean
  }>(),
  {
    level: 0,
    link: undefined,
    subtree: undefined,
    active: false,
  },
)

const style = computed(() => {
  if (props.level === 0) {
    return {
      'mask-image': `url(${getIconPath(routeName.value)}`,
    }
  }
  return ''
})

const getIconPath = (routeName: string | undefined | null) => {
  if (!routeName) {
    return adminToolbarIcons.fallback
  }
  return adminToolbarIcons[routeName] || adminToolbarIcons.fallback
}

const emit = defineEmits(['hover'])

const localActive = ref(-1)

let timeout: any = null

function onMouseOver() {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('hover')
  }, 300)
}

function onMouseLeave() {
  clearTimeout(timeout)
}

watch(
  () => props.active,
  (isActive) => {
    if (!isActive) {
      localActive.value = -1
    }
  },
)

const routeName = computed(() => {
  const url = props.link?.url
  if (url && 'routeName' in url) {
    return url.routeName
  }
  return ''
})
</script>
