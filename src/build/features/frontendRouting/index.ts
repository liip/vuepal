import fs from 'node:fs'
import { addTemplate } from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'
import { defineVuepalFeature } from '../defineFeature'
import type { FileCache } from '../../classes/FileCache'
import type { ModuleHelper } from '../../classes/ModuleHelper'
import { logger } from '../../helpers'

function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

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

  const jsonString = `{${match.trim().replace(/'/g, '"')}}`

  const fn = new Function(`return ${jsonString}`)
  const mapping = fn()
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
}

type ExtractedPage = {
  filePath: string
  isDrupalFrontendRoute: boolean
  yml?: string
}

class PageCollector {
  private cache: FileCache<ExtractedPage>
  private templateContents = ''

  constructor(
    helper: ModuleHelper,
    private langcodes: string[],
  ) {
    this.cache = helper.createFileCache()
  }

  private async handlePage(page: NuxtPage): Promise<ExtractedPage | undefined> {
    if (!page.file) {
      return
    }

    if (!page.name) {
      return
    }

    const name = page.name

    const cached = this.cache.get(page.file)
    if (cached) {
      return cached
    }

    const contents = await fs.promises
      .readFile(page.file)
      .then((v) => v.toString())

    const extracted: ExtractedPage = {
      filePath: page.file,
      isDrupalFrontendRoute: false,
    }

    if (contents.includes('drupalFrontendRoute')) {
      extracted.isDrupalFrontendRoute = true
      try {
        const languageMapping = extractLanguageMapping(contents)
        if (languageMapping) {
          const mapping = Object.entries(languageMapping)
            .map(([langcode, path]) => {
              return `      ${langcode}: '${path}'`
            })
            .join('\n')
          extracted.yml = `  ${name}:\n    aliases:\n${mapping}`
        }
      } catch (e) {
        logger.warn(
          `Failed to extract language mapping in page "${page.file}"`,
          e,
        )
      }
    }

    this.cache.set(page.file, extracted)
    return extracted
  }

  public async handlePages(pages: NuxtPage[]) {
    const mapped = await Promise.all(
      pages.map((page) => this.handlePage(page)),
    ).then((result) =>
      result
        .map((v) => v?.yml)
        .filter(nonNullable)
        .sort(),
    )

    this.templateContents = `keys:\n${mapped.join('\n')}`
  }

  getTemplateContents(): string {
    return this.templateContents
  }
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
    helper.addTemplate('page-meta', null, () => {
      return `
declare module "#app" {
  interface PageMeta {
    /**
      * If set to true, this route is considered a "Drupal Frontend Route".
      * It will generate an entry in the frontend_routing.settings.yml file.
      *
      * This will make sure that the node connected to this Nuxt page will always
      * have the paths defined in this component. It will not be possible to
      * override the path in Drupal.
      */
    drupalFrontendRoute?: boolean
  }
}

export {}
`
    })

    if (helper.isModuleBuild) {
      return
    }

    const outputPath = options?.outputPath
    const langcodes = options?.langcodes
    if (!outputPath) {
      throw new Error(`Missing required option "frontendRouting.outputPath".`)
    }

    if (!langcodes?.length) {
      throw new Error(`Missing required option "frontendRouting.langcodes".`)
    }

    const collector = new PageCollector(helper, langcodes)

    addTemplate({
      filename: helper.resolvers.root.resolve(options.outputPath),
      write: true,
      getContents: () => collector.getTemplateContents(),
    })

    // This hook is called by Nuxt when any page changes.
    // During development, the hook is called *after* the builder:watch
    // event.
    helper.nuxt.hooks.hook('pages:resolved', async (pages) => {
      helper.logDebug('frontendRouting: pages:resolved start')
      await collector.handlePages(pages)
      helper.logDebug('frontendRouting: pages:resolved done')
    })
  },
})
