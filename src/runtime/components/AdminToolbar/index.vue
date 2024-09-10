<template>
  <div
    v-if="data"
    class="vuepal-admin-toolbar"
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
} from '#imports'
import adapter from '#vuepal/adapter'
import '#vuepal/styles'
import Palette from './Palette/index.vue'

const language = adapter.getCurrentLanguage()

const active = ref(-1)
const showPalette = ref(false)
const renderPalette = ref(false)

let timeout: any = null

const onMouseLeave = () => {
  clearTimeout(timeout)
  timeout = window.setTimeout(() => {
    active.value = -1
  }, 600)
}

const onMouseEnter = () => {
  clearTimeout(timeout)
}

if (!adapter.getAdminMenu) {
  throw new Error(
    '<VuepalAdminToolbar> was rendered, but getAdminMenu() adapter method is not implemented.',
  )
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
      return { links, environment: v?.activeEnvironment }
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
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>
