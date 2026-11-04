/**
 * Extract the ID from a Vimeo URL.
 */
export function extractVimeoId(url: string): string | undefined {
  const regex =
    // For some reason it thinks that the last \/ is unnecessary, but the entire regex becomes illegal if that's removed.

    /^(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)[^\s/]*$/g
  const matches = Array.from(url.matchAll(regex))[0]

  return matches?.[1]
}

/**
 * Extract the ID from a YouTube URL.
 *
 * Returns null when the ID is not 11 letters, digits, "-" or "_", e.g. for
 * "watch?v=../../abcde".
 */
export function extractYouTubeId(url: string): string | null {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const id = url.match(regExp)?.[7]
  return id && /^[\w-]{11}$/.test(id) ? id : null
}

type YouTubeThumbnailSize =
  | 'default' // 120 x 90
  | 'mqdefault' // 320 x 180
  | 'hqdefault' // 480 x 360
  | 'sddefault' // 640 x 480
  | 'maxresdefault' // 1280 x 720

/**
 * Generate a thumbnail URL for a YouTube video ID.
 */
export function buildYouTubeThumbnailUrl(
  id: string,
  size: YouTubeThumbnailSize = 'maxresdefault',
) {
  return `https://i3.ytimg.com/vi/${id}/${size}.jpg`
}
