<template>
  <div
    v-if="data"
    ref="root"
    class="vuepal-admin-toolbar vuepal-root"
    :class="{ 'vp-is-collapsed': collapsed }"
    :style="style"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <!-- The bar doesn't fit: the Drupal logo and a button for the sidebar. -->
    <div v-if="collapsed" class="vuepal-admin-toolbar-collapsed">
      <ul v-if="frontLink" class="vuepal-admin-toolbar-bar">
        <AdminToolbarSubtree
          :active="active === frontLink.index"
          :link="frontLink.link"
          :subtree="frontLink.subtree"
          @open="active = frontLink.index"
        />
      </ul>
      <button
        ref="menuButton"
        type="button"
        class="vuepal-admin-toolbar-menu-button"
        :aria-expanded="sidebarOpen"
        @click="sidebarOpen = !sidebarOpen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ manageLabel }}</span>
      </button>
    </div>

    <!-- Stays rendered while collapsed, to measure whether it fits again. -->
    <ul
      v-if="data.links.length"
      ref="bar"
      class="vuepal-admin-toolbar-bar"
      :inert="collapsed"
    >
      <AdminToolbarSubtree
        v-for="(link, i) in data.links"
        :key="i"
        :active="!collapsed && active === i"
        :link="link.link"
        :subtree="link.subtree"
        @open="active = i"
      />
    </ul>

    <nav
      v-if="collapsed && sidebarOpen"
      ref="sidebar"
      class="vuepal-admin-toolbar-sidebar"
      :style="{ top: `${sidebarTop}px` }"
    >
      <AdminToolbarSidebar :links="sidebarLinks" />
    </nav>
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
import AdminToolbarSidebar from './Sidebar.vue'
import {
  ref,
  useLazyAsyncData,
  computed,
  onMounted,
  onBeforeUnmount,
  provide,
  useHead,
  watch,
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
const root = ref<HTMLDivElement | null>(null)
const bar = ref<HTMLUListElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const sidebar = ref<HTMLElement | null>(null)

/**
 * Whether the bar doesn't fit, so that it collapses into the Drupal logo and a
 * button that opens the links in a sidebar.
 */
const collapsed = ref(false)
const sidebarOpen = ref(false)

/**
 * The label of the button, from Drupal's translations of "Manage" in the
 * toolbar.
 */
const MANAGE_LABELS: Record<string, string> = {
  en: 'Manage',
  de: 'Verwalten',
  fr: 'Gérer',
  it: 'Gestisci',
}

const manageLabel = computed(
  () => MANAGE_LABELS[language.value] ?? MANAGE_LABELS.en,
)

function measure() {
  if (!root.value || !bar.value) {
    return
  }
  // The bar is as wide as its links.
  const { marginLeft, marginRight } = getComputedStyle(bar.value)
  const available =
    root.value.getBoundingClientRect().width -
    parseFloat(marginLeft) -
    parseFloat(marginRight)
  collapsed.value = bar.value.getBoundingClientRect().width > available
}

// The toolbar changes size with the window, the bar when the font loads or
// the labels change.
let resizeObserver: ResizeObserver | null = null

function observe() {
  resizeObserver?.disconnect()
  for (const el of [root.value, bar.value]) {
    if (el) {
      resizeObserver?.observe(el)
    }
  }
}

watch([root, bar], observe)

watch(collapsed, () => {
  active.value = -1
  sidebarOpen.value = false
})

// The sidebar is fixed to the window, below the toolbar, which may scroll
// with the page.
const sidebarTop = ref(0)

function updateSidebarTop() {
  sidebarTop.value = Math.max(
    0,
    root.value?.getBoundingClientRect().bottom ?? 0,
  )
}

watch(sidebarOpen, (isOpen) => {
  if (isOpen) {
    updateSidebarTop()
    window.addEventListener('scroll', updateSidebarTop, { passive: true })
  } else {
    window.removeEventListener('scroll', updateSidebarTop)
  }
})

function closeSidebar() {
  const hadFocus = !!sidebar.value?.contains(document.activeElement)
  sidebarOpen.value = false
  if (hadFocus) {
    menuButton.value?.focus()
  }
}

// Closes the submenus and the sidebar. Needed for touch, which doesn't leave
// the toolbar.
function onDocumentPointerDown(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) {
    active.value = -1
    sidebarOpen.value = false
  }
}

const showPalette = ref(false)
const renderPalette = ref(false)

let timeout: number | null = null

// A touch pointer leaves when the finger is lifted.
const onPointerLeave = (e: PointerEvent) => {
  if (e.pointerType === 'touch') {
    return
  }
  if (timeout) {
    clearTimeout(timeout)
  }
  timeout = window.setTimeout(() => {
    active.value = -1
  }, 600)
}

const onPointerEnter = () => {
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

/**
 * The Drupal logo of admin_toolbar_tools, which stays in the collapsed bar.
 */
const frontLink = computed(() => {
  const links = data.value?.links ?? []
  const index = links.findIndex(
    (link) => link.link?.url?.routeName === '<front>',
  )
  const link = links[index]
  return link ? { ...link, index } : null
})

const sidebarLinks = computed(() =>
  (data.value?.links ?? []).filter(
    (_, index) => index !== frontLink.value?.index,
  ),
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
    closeSidebar()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('pointerdown', onDocumentPointerDown)
  pointerHistory.start()
  resizeObserver = new ResizeObserver(measure)
  observe()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  pointerHistory.stop()
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', updateSidebarTop)
})
</script>
