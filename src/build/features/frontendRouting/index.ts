import fs from 'node:fs'
import { addTemplate } from '@nuxt/kit'
import { stringify } from 'yaml'
import type { NuxtPage } from '@nuxt/schema'
import { nonNullable } from './../../../runtime/helpers/type'
import { defineVuepalFeature } from '../defineFeature'

/**
 * Extracts the language mapping.
 */
const extractLanguageMapping = (
  code: string,
): Record<string, string> | undefined => {
  const RGX = /languageMapping:\s*\{([^}]+)\}/
  const matches = code.match(RGX)

  const match = matches?.[1]

  if (!match) {
    return
  }

  try {
    const jsonString = `{${match.trim().replace(/'/g, '"')}}`

    const mapping = eval(`(${jsonString})`)
    if (typeof mapping !== 'object') {
      return
    }

    for (const key in mapping) {
      if (typeof key !== 'string') {
        return
      }

      const value = mapping[key]

      if (typeof value !== 'string') {
        return
      }
    }

    return mapping
  } catch (e) {
    console.log('Error in Vuepal:')
    console.log(e)
  }
}

type ExtractedDrupalFrontendRoute = {
  aliases: Record<string, string>
  path: string
  name: string
}

type DrupalFrontendRouteEntry = {
  aliases: Record<string, string>
}

const extractFrontendRouteData = async (
  page: NuxtPage,
  isSingleLanguage: boolean,
): Promise<ExtractedDrupalFrontendRoute | undefined> => {
  if (!page.file || !page.name) {
    return
  }
  const code = await fs.promises.readFile(page.file).then((v) => v.toString())

  if (!code.includes('drupalFrontendRoute')) {
    return
  }

  const aliases = extractLanguageMapping(code)
  if (!aliases && !isSingleLanguage) {
    return
  }
  return {
    path: page.path,
    name: page.name,
    aliases: aliases || {},
  }
}

const generateFrontendRoutesYaml = (
  pages: NuxtPage[],
  langcodes: string[],
): Promise<string> => {
  const isSingleLanguage = langcodes.length === 1
  return Promise.all(
    pages.map((v) => extractFrontendRouteData(v, isSingleLanguage)),
  ).then((routes) => {
    const sortedRoutes = routes
      .filter(nonNullable)
      .sort((a, b) => a.name.localeCompare(b.name))
    const keys = sortedRoutes.reduce<Record<string, DrupalFrontendRouteEntry>>(
      (acc, v) => {
        const allLangcodes: Record<string, string> = langcodes.reduce<
          Record<string, string>
        >((acc, langcode) => {
          acc[langcode] = v.aliases[langcode] || v.path
          return acc
        }, {})
        acc[v.name] = {
          aliases: allLangcodes,
        }

        return acc
      },
      {},
    )

    return stringify({ keys }, { sortMapEntries: true })
  })
}

export default defineVuepalFeature<{
  /**
   * The supported language codes.
   */
  langcodes: string[]

  /**
   * The output path of the generated YML file.
   *
   * @example './../drupal/config/default/frontend_routing.settings.yml'
   */
  outputPath: string
}>({
  name: 'frontendRouting',
  description: '',
  setup(helper, options) {
    if (!helper.isModuleBuild && options?.outputPath) {
      let templateContents = ''
      const templatePath = helper.resolvers.root.resolve(options.outputPath)

      addTemplate({
        filename: templatePath,
        write: true,
        getContents: (ctx) => {
          return ''
        },
      })
    }

    // function buildTemplateContents() {
    //   const pages: NuxtPage[] = ctx.app.pages || []
    //   return generateFrontendRoutesYaml(pages, options.langcodes)
    // }

    helper.addTemplate('page-meta', null, () => {
      return `
declare module "#app" {
  interface PageMeta {
    /**
      * If set to true, this route is considered a "Drupal Frontend Route".
      * It will generate an entry in the frontend_routing.settings.yml file.
      *
      * This will make sure that the node connected to this route will always
      * have the paths defined in this component. It will not be possible to
      * override the path in Drupal.
      */
    drupalFrontendRoute?: boolean
  }
}

export {}
`
    })
  },
})
