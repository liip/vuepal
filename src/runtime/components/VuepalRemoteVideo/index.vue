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
  }>(),
  {
    url: '',
  },
)

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
  if (kind.value === VideoSourcePlatform.YOUTUBE) {
    return `https://www.youtube.com/embed/${videoId.value}?modestbranding=1&rel=0&autoplay=1`
  } else if (kind.value === VideoSourcePlatform.VIMEO) {
    return `https://player.vimeo.com/video/${videoId.value}?autoplay=1`
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
