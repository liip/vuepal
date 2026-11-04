<template>
  <div class="vp-highlight">
    <template v-for="(segment, i) in segments" :key="i">
      <em v-if="segment.highlighted">{{ segment.text }}</em>
      <template v-else>{{ segment.text }}</template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from '#imports'

const props = defineProps<{
  /**
   * The text to find the matches in, e.g. the label of a menu link.
   */
  text: string

  /**
   * The indices of the matched characters.
   */
  positions: number[]
}>()

type Segment = {
  text: string
  highlighted: boolean
}

/**
 * Splits the text into runs of matched and unmatched characters.
 *
 * The text is rendered with interpolation, so markup in a label (which editors
 * can enter in Drupal) is shown as text.
 */
const segments = computed<Segment[]>(() => {
  const positions = new Set(props.positions)
  const result: Segment[] = []

  for (let i = 0; i < props.text.length; i++) {
    const highlighted = positions.has(i)
    const last = result.at(-1)
    if (last && last.highlighted === highlighted) {
      last.text += props.text.charAt(i)
    } else {
      result.push({ text: props.text.charAt(i), highlighted })
    }
  }

  return result
})
</script>
