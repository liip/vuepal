/**
 * Checks if the URL is external.
 */
export function isExternal(href = '', origin = '') {
  if (origin && href.startsWith(origin)) {
    return false
  }
  return /^(mailto:|tel:|\/media|http|www)/.test(href)
}

/**
 * Convert absolute URLs to relative.
 */
export function toRelativeUrl(url = '') {
  return url.replace(/^https?:\/\/[^/]*/gm, '')
}

/**
 * Creates a simple slug from a string.
 */
export function slugify(text = ''): string {
  if (typeof text !== 'string') {
    return ''
  }
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/[àáâä]/g, 'a')
    .replace(/ç/g, 'c')
    .replace(/[èéêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/-{2,}/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export function getUrlExtension(url: string): string | undefined {
  if (!url) {
    return
  }
  try {
    const parts = url.split(/[#?]/)
    return parts[0].split('.').pop()?.trim().toLowerCase() || ''
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    // Noop.
  }
}
