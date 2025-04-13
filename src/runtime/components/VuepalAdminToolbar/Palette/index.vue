<template>
  <div
    v-show="visible"
    class="vuepal-command-palette"
    @wheel.stop
    @click.stop
    @keydown="onKeyDown"
  >
    <div class="vuepal-command-palette-input">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
        />
      </svg>
      <input
        ref="inputEl"
        v-model="text"
        type="text"
        placeholder="Search menu..."
      />
    </div>
    <div class="vuepal-command-palette-results vuepal-scrollbar-dark">
      <button
        v-for="(match, index) in matches"
        :key="match.item.id"
        class="vuepal-command-palette-item"
        :class="{ 'vp-is-focused': index === focusedIndex }"
        :data-vp-palette-item="index"
        @mouseenter="focusedIndex = index"
      >
        <Highlight :text="match.item.breadcrumb" :positions="match.positions" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AdminMenuLinkFragment } from '#vuepal/types'
import Highlight from './Highlight.vue'
import { computed, onMounted, ref, watch, nextTick } from '#imports'
import { Fzf } from 'fzf'

const props = defineProps<{
  links: AdminMenuLinkFragment[]
  visible: boolean
}>()

const emit = defineEmits(['close'])

type MappedLink = {
  id: string
  url: string
  label: string
  breadcrumb: string
}
const modulo = (n: number, m: number) => ((n % m) + m) % m

const focusedIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

watch(
  () => props.visible,
  (isVisible) => {
    nextTick(() => {
      if (isVisible && inputEl.value) {
        inputEl.value.focus()
        inputEl.value.select()
      }
    })
  },
)

const focusPrev = () => {
  if (!matches.value?.length) {
    return
  }
  focusedIndex.value = modulo(focusedIndex.value - 1, matches.value.length)
  scrollFocusedIntoView()
}

const focusNext = () => {
  if (!matches.value?.length) {
    return
  }
  focusedIndex.value = modulo(focusedIndex.value + 1, matches.value.length)
  scrollFocusedIntoView()
}

const scrollFocusedIntoView = () => {
  const element = document.querySelector(
    `[data-vp-palette-item="${focusedIndex.value}"]`,
  )
  if (element) {
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

const onSelect = () => {
  const item = matches.value[focusedIndex.value]
  if (!item) {
    return
  }

  window.location.href = item.item.url
}

const onKeyDown = (e: KeyboardEvent) => {
  const stop = () => {
    e.preventDefault()
    e.stopPropagation()
  }
  if (e.code === 'Tab') {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    e.shiftKey ? focusPrev() : focusNext()
    stop()
  } else if (e.code === 'ArrowDown') {
    stop()
    focusNext()
  } else if (e.code === 'ArrowUp') {
    stop()
    focusPrev()
  } else if (e.code === 'Enter') {
    onSelect()
    stop()
  } else if (e.code === 'Escape') {
    emit('close')
    stop()
  }
}

let counter = 0

function flattenAdminMenuLinks(
  links: AdminMenuLinkFragment[],
  breadcrumb: string[] = [],
): MappedLink[] {
  let flattenedLinks: MappedLink[] = []

  links.forEach((link) => {
    if (link.link?.label && link.link.url?.path) {
      // Construct a new breadcrumb trail for the next level.
      const newBreadcrumb = [...breadcrumb, link.link.label]

      // Use the current breadcrumb for this link's breadcrumb.
      const breadcrumbStr = newBreadcrumb.join(' » ')

      // Only add the link if the url.path exists.
      if (link.link.url?.path) {
        counter++
        flattenedLinks.push({
          id: counter.toString(),
          url: link.link.url.path,
          label: link.link.label,
          breadcrumb: breadcrumbStr,
        })
      }

      // If there's a subtree, recursively flatten it, passing the updated breadcrumb.
      if (link.subtree && link.subtree.length > 0) {
        flattenedLinks = flattenedLinks.concat(
          flattenAdminMenuLinks(link.subtree, newBreadcrumb),
        )
      }
    }
  })

  return flattenedLinks
}

const items = computed<MappedLink[]>(() => flattenAdminMenuLinks(props.links))

const fzf = new Fzf(items.value, {
  selector: (item) => item.breadcrumb,
})

const text = ref('')

watch(text, () => {
  focusedIndex.value = 0
})

const matches = computed<{ item: MappedLink; positions: number[] }[]>(() => {
  if (!text.value) {
    return []
  }

  const results = fzf.find(text.value)
  return results.slice(0, 30).map((v) => {
    return {
      item: v.item,
      positions: [...v.positions],
    }
  })
})

onMounted(() => {
  if (inputEl.value) {
    inputEl.value.focus()
  }
})
</script>
