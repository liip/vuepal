import { defineEventHandler, getQuery } from 'h3'
import type { InitData, MenuLink } from '~/types'

const menuLinks = (language: string): MenuLink[] =>
  [
    {
      url: '/test',
      label: 'Test',
    },
    {
      url: '/test-redirect',
      label: 'Test Redirect',
    },
  ].map((v) => {
    return {
      ...v,
      url: `/${language}${v.url}`,
    }
  })

export default defineEventHandler<InitData>((event) => {
  const query = getQuery(event)
  const language = typeof query.language === 'string' ? query.language : 'en'
  return {
    menuLinks: menuLinks(language),
  }
})
