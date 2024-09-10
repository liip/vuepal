<template>
  <component :is="component" v-bind="componentProps" @click="onClick">
    <slot :is-external="isExternal" />
  </component>
</template>

<script lang="ts" setup>
import { useRouter, useRoute, computed } from '#imports'
import { getUrlExtension } from '../../helpers/url'

const props = defineProps<{
  to?: string
  target?: string
  isLink?: boolean
  activeClass?: string
}>()

const EXTERNAL_URL_EXTENSIONS = ['jpg', 'png', 'svg', 'pdf']

const router = useRouter()
const route = useRoute()

const href = computed(() => {
  if (!props.to) {
    return ''
  }

  if (props.to.startsWith('www')) {
    return `https://${props.to}`
  }

  return props.to
})

const component = computed(() => (href.value ? 'a' : 'div'))
const urlExtension = computed(() => getUrlExtension(href.value) || '')

const isExternal = computed(
  () =>
    href.value.startsWith('http') ||
    href.value.startsWith('mailto:') ||
    href.value.startsWith('tel:') ||
    EXTERNAL_URL_EXTENSIONS.includes(urlExtension.value),
)
const isActive = computed(() =>
  route.path && href.value ? route.path.startsWith(href.value) : false,
)

const componentProps = computed<Record<string, string | string[]>>(() => {
  const componentProps: Record<string, any> = {
    class: [],
  }
  if (href.value) {
    componentProps.href = href.value

    if (props.target) {
      componentProps.target = props.target
    } else if (isExternal.value) {
      componentProps.target = '_blank'
    }
  }

  if (props.isLink) {
    componentProps.class.push('link')
    componentProps.class.push(isExternal.value ? 'is-external' : 'is-internal')
  }

  if (isActive.value) {
    componentProps.class.push(props.activeClass || 'nuxt-link-exact-active')
  }

  return componentProps
})

function onClick(e: Event) {
  if (isExternal.value) {
    return
  }

  e.preventDefault()
  router.push(href.value)
}
</script>
