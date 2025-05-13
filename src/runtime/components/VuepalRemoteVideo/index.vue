<template>
  <slot
    v-if="url && videoId && embedUrl"
    :video-id="videoId"
    :embed-url="embedUrl"
    :thumbnail-url="thumbnailUrl"
  />
</template>

<script lang="ts" setup>
import { computed } from '#imports'
import {
  buildYouTubeThumbnailUrl,
  extractVimeoId,
  extractYouTubeId,
} from '../../helpers/video'

const props = withDefaults(
  defineProps<{
    url?: string
    autoplay?: boolean
    muted?: boolean
    controls?: boolean
    loop?: boolean
  }>(),
  {
    url: '',
    autoplay: false,
    muted: false,
    controls: true,
    loop: false,
  },
)

defineSlots<{
  default(props: {
    videoId: string
    embedUrl: string
    thumbnailUrl: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): any
}>()

enum VideoSourcePlatform {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
}

const kind = computed<VideoSourcePlatform | undefined>(() => {
  // Matching `youtu` for youtube.com and youtu.be
  if (props.url.toLowerCase().includes('youtu')) {
    return VideoSourcePlatform.YOUTUBE
  }

  if (props.url.toLowerCase().includes('vimeo')) {
    return VideoSourcePlatform.VIMEO
  }
  return undefined
})

const videoId = computed(() => {
  if (kind.value === VideoSourcePlatform.YOUTUBE) {
    return extractYouTubeId(props.url)
  } else if (kind.value === VideoSourcePlatform.VIMEO) {
    return extractVimeoId(props.url)
  }
  return ''
})

const embedUrl = computed(() => {
  if (kind.value === VideoSourcePlatform.YOUTUBE && videoId.value) {
    const params = new URLSearchParams({
      rel: '0',
      autoplay: props.autoplay ? '1' : '0',
      mute: props.muted ? '1' : '0',
      controls: props.controls ? '1' : '0',
      loop: props.loop ? '1' : '0',
    })
    return `https://www.youtube.com/embed/${videoId.value}?${params.toString()}`
  } else if (kind.value === VideoSourcePlatform.VIMEO && videoId.value) {
    const params = new URLSearchParams({
      autoplay: props.autoplay ? '1' : '0',
      muted: props.muted ? '1' : '0',
      controls: props.controls ? '1' : '0',
      loop: props.loop ? '1' : '0',
    })
    return `https://player.vimeo.com/video/${videoId.value}?${params.toString()}`
  }
  return ''
})

const thumbnailUrl = computed(() => {
  if (kind.value === VideoSourcePlatform.YOUTUBE && videoId.value) {
    return buildYouTubeThumbnailUrl(videoId.value)
  }
  return ''
})
</script>
