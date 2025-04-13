import { isExternal, toRelativeUrl } from './../helpers/url'
import { useRouter } from '#imports'

export function useClickTriggerProxy() {
  /**
   * Click handler for wrapping CMS content in order to catch links to
   * internal pages.
   */
  function onClick(e: MouseEvent | KeyboardEvent) {
    if (!e.target || !('href' in e.target)) {
      return
    }

    // Check if the URL is external.
    const target = e.target as HTMLAnchorElement
    const href = target.href
    if (isExternal(href, window.location.origin)) {
      return
    }

    // Anchor link on same page.
    if (href.startsWith('#')) {
      return
    }

    // Let Nuxt handle the routing.
    e.preventDefault()
    const router = useRouter()
    router.push(toRelativeUrl(href))
  }
  return { onClick }
}
