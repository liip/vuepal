<template>
  <li
    v-if="link"
    ref="item"
    :class="{ 'vp-is-front': level === 0 && routeName === '<front>' }"
  >
    <a
      class="vuepal-admin-toolbar-link"
      :class="{
        'vp-is-first': level === 0,
        'vp-is-open': active && hasSubtree,
      }"
      :href="link.url?.path || ''"
      :data-route-name="routeName"
      @pointerenter="onPointer"
      @pointermove="onPointer"
      @pointerleave="onPointerLeave"
      @pointerdown="pointerType = $event.pointerType"
      @click="onClick"
    >
      <span v-if="style" class="vuepal-admin-toolbar-icon" :style="style" />
      <span class="vuepal-admin-toolbar-text">{{ link!.label }}</span>

      <!-- The "handle" icon of Gin. -->
      <svg
        v-if="hasSubtree && level > 0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="m8 20 8-8-8-8"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>
    <ul v-if="hasSubtree && active">
      <AdminToolbarSubtree
        v-for="(subLink, i) in subtree"
        :key="i"
        :level="level + 1"
        :active="localActive === i"
        :link="subLink.link"
        :subtree="
          'subtree' in subLink && subLink.subtree ? subLink.subtree : undefined
        "
        @open="localActive = i"
      />
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { ref, watch, computed, inject, onBeforeUnmount } from '#imports'
import { adminToolbarIcons } from '#vuepal-build/admin-config'
import type { AdminMenuLinkFragment } from './../../types'
import { createHoverIntent, POINTER_HISTORY } from './../../helpers/hoverIntent'

defineOptions({
  name: 'AdminToolbarSubtree',
})

const props = withDefaults(
  defineProps<{
    level?: number
    link?: AdminMenuLinkFragment['link']
    subtree?: AdminMenuLinkFragment['subtree']
    active?: boolean
  }>(),
  {
    level: 0,
    link: undefined,
    subtree: undefined,
    active: false,
  },
)

const hasSubtree = computed(() => !!props.subtree?.length)

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

const emit = defineEmits<{
  /** Makes the link the active one of its list, which opens its submenu. */
  open: []
}>()

const item = ref<HTMLLIElement | null>(null)

const hoverIntent = createHoverIntent({
  history: inject(POINTER_HISTORY, null),
  isTopLevel: () => props.level === 0,
  isActive: () => props.active,
  // Only the active link of a list renders its submenu.
  getOpenSubmenu: () =>
    item.value?.parentElement?.querySelector(':scope > li > ul') ?? null,
  onIntent: () => emit('open'),
})

// A timer still running when the parent submenu closes would make this link
// active again, so it would be open the next time the parent submenu opens.
onBeforeUnmount(hoverIntent.cancel)

// Touch has no hover. The browser still sends pointer events for a tap, which
// must not open the submenu: the tap does (onClick()).
function onPointer(e: PointerEvent) {
  if (e.pointerType !== 'touch') {
    hoverIntent.onPointer(e)
  }
}

function onPointerLeave(e: PointerEvent) {
  if (e.pointerType !== 'touch') {
    hoverIntent.cancel()
  }
}

/** The type of the pointer that clicks the link. */
let pointerType = ''

// The first tap opens the submenu, the second follows the link.
function onClick(e: MouseEvent) {
  if (pointerType === 'touch' && hasSubtree.value && !props.active) {
    e.preventDefault()
    emit('open')
  }
  pointerType = ''
}

const localActive = ref(-1)

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
