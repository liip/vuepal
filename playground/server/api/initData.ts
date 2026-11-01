import { defineEventHandler, getQuery } from 'h3'
import type { InitData, MenuLink } from '~~/types'

// Paths created by drupal/content.php.
const menuLinks: Record<string, MenuLink[]> = {
  de: [
    { url: '/de/ueber-uns', label: 'Über uns' },
    { url: '/de/ueber-uns/team', label: 'Team' },
    { url: '/de/artikel/erster-artikel', label: 'Artikel' },
    { url: '/de/alte-seite', label: 'Redirect' },
    { url: '/de/download', label: 'Redirect to download' },
    { url: '/de/gibt-es-nicht', label: 'Not found' },
  ],
  en: [
    { url: '/en/about-us', label: 'About us' },
    { url: '/en/about-us/team', label: 'Team' },
    { url: '/en/articles/first-article', label: 'Article' },
    { url: '/en/old-page', label: 'Redirect' },
    { url: '/en/does-not-exist', label: 'Not found' },
  ],
}

export default defineEventHandler<InitData>((event) => {
  const query = getQuery(event)
  const language = query.language === 'en' ? 'en' : 'de'
  return {
    menuLinks: menuLinks[language]!,
  }
})
