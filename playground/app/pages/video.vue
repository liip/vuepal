<template>
  <ul class="remote-videos">
    <li v-for="url in urls" :key="url" :data-url="url">
      <VuepalRemoteVideo v-slot="{ embedUrl }" :url="url">
        <span class="embed-url">{{ embedUrl }}</span>
      </VuepalRemoteVideo>
    </li>
  </ul>
</template>

<script lang="ts" setup>
const urls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ?t=10',
  'https://vimeo.com/76979871',
  // Not a YouTube ID, the embed URL would resolve to youtube.com/abcde.
  'https://www.youtube.com/watch?v=../../abcde',
]
</script>
