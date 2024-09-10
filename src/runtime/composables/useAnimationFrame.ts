import { onMounted, onBeforeUnmount } from '#imports'

/**
 * Execute the given callback in a request animation frame loop.
 *
 * The callback receives the elapsed time since the first iteration of the
 * loop as milliseconds.
 */
export function useAnimationFrame(cb: (elapsed: number) => void) {
  let raf: number | null = null
  let start: number | null = null

  const loop = (timestamp: number) => {
    // Set the start timestamp.
    if (start === null) {
      start = timestamp
    }

    // Calculate the elapse time.
    const elapsed = timestamp - start
    cb(elapsed)
    raf = window.requestAnimationFrame(loop)
  }

  onMounted(() => {
    raf = window.requestAnimationFrame(loop)
  })

  onBeforeUnmount(() => {
    if (raf) {
      window.cancelAnimationFrame(raf)
    }
  })
}
