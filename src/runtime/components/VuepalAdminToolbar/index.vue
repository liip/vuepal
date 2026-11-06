<template>
  <div
    v-if="data"
    class="vuepal-admin-toolbar vuepal-root"
    :style="style"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <ul v-if="data.links?.length">
      <AdminToolbarSubtree
        v-for="(link, i) in data.links"
        :key="i"
        :active="active === i"
        :link="link.link"
        :subtree="link.subtree"
        @hover="active = i"
      />
    </ul>
  </div>

  <Teleport to="body">
    <Palette
      v-if="data?.links && renderPalette && data.links.length"
      :visible="showPalette"
      :links="data.links"
      @close="showPalette = false"
    />
  </Teleport>
</template>

<script lang="ts" setup>
import AdminToolbarSubtree from './Subtree.vue'
import {
  ref,
  useLazyAsyncData,
  computed,
  onMounted,
  onBeforeUnmount,
  provide,
  useHead,
} from '#imports'
import { createAdapter } from '#vuepal-build/adapter'
import './../../css/output.css'
import Palette from './Palette/index.vue'
import type { AdminMenuLinkFragment } from './../../types'
import {
  createPointerHistory,
  POINTER_HISTORY,
} from './../../helpers/hoverIntent'

const adapter = createAdapter()
const language = adapter.getCurrentLanguage()

const pointerHistory = createPointerHistory()
provide(POINTER_HISTORY, pointerHistory)

// The font of Gin. Like the icons, it's loaded from the Gin theme in Drupal.
// In output.css, Vite would warn in every build that it can't resolve the URL.
useHead({
  style: [
    {
      key: 'vuepal-admin-toolbar-font',
      textContent: `@font-face {
  font-family: 'Ginter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/themes/contrib/gin/dist/media/font/inter.woff2') format('woff2');
}`,
    },
  ],
})

const active = ref(-1)
const showPalette = ref(false)
const renderPalette = ref(false)

let timeout: number | null = null

const onMouseLeave = () => {
  if (timeout) {
    clearTimeout(timeout)
  }
  timeout = window.setTimeout(() => {
    active.value = -1
  }, 600)
}

const onMouseEnter = () => {
  if (timeout) {
    clearTimeout(timeout)
  }
}

if (!adapter.getAdminMenu) {
  throw new Error(
    '<VuepalAdminToolbar> was rendered, but getAdminMenu() adapter method is not implemented.',
  )
}

/**
 * Gin moves these links to the end of the toolbar (gin_preprocess_menu()).
 */
const MOVED_TO_END = ['system.admin_config', 'help.main']

function moveToEnd(links: AdminMenuLinkFragment[]): AdminMenuLinkFragment[] {
  const routeName = (link: AdminMenuLinkFragment) =>
    link.link?.url?.routeName ?? ''
  return [
    ...links.filter((link) => !MOVED_TO_END.includes(routeName(link))),
    ...MOVED_TO_END.flatMap((name) =>
      links.filter((link) => routeName(link) === name),
    ),
  ]
}

const { data } = useLazyAsyncData(
  () =>
    adapter.getAdminMenu!().then((v) => {
      const menu = v?.menu
      const links =
        menu && 'links' in menu && menu.links
          ? (menu.links[menu.links.length - 1]?.subtree || []).filter(
              (v) => !!v.link,
            )
          : []
      return { links: moveToEnd(links), environment: v?.activeEnvironment }
    }),
  {
    watch: [language],
  },
)

const style = computed(() => {
  if (data.value?.environment?.bgColor) {
    return {
      borderTopColor: data.value.environment.bgColor,
      '--vuepal-environment-color': data.value.environment.bgColor,
    }
  }
  return {}
})

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'KeyK' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    renderPalette.value = true
    showPalette.value = true
  } else if (e.code === 'Escape') {
    showPalette.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  pointerHistory.start()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  pointerHistory.stop()
})
</script>
