import { addTemplate, extendPages } from '@nuxt/kit'
import { relative } from 'pathe'
import type { NuxtPage } from '@nuxt/schema'
import { defineVuepalFeature } from '../defineFeature'
import { logger } from '../../helpers'

function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

type ExtractedPage = {
  filePath: string
  isDrupalFrontendRoute: boolean
  yml?: string
}

class PageCollector {
  private templateContents = ''

  constructor(private defaultLanguage: string) {}

  private handlePage(page: NuxtPage): ExtractedPage | undefined {
    const name = page.name

    if (!page.file) {
      return
    }

    const extracted: ExtractedPage = {
      filePath: page.file,
      isDrupalFrontendRoute: false,
    }

    if (page.meta?.drupalFrontendRoute) {
      extracted.isDrupalFrontendRoute = true
      try {
        const mapping = Object.entries<string>({
          ...(page.meta.languageMapping || {}),
          [this.defaultLanguage]: page.path,
        })
          .map(([langcode, path]) => {
            const pathValue = path.includes(' ') ? `'${path}'` : path
            return `      ${langcode}: ${pathValue}`
          })
          .sort()
          .join('\n')
        extracted.yml = `  ${name}:\n    aliases:\n${mapping}`
      } catch (e) {
        logger.warn(
          `Failed to extract language mapping in page "${page.file}"`,
          e,
        )
      }
    }

    return extracted
  }

  public handlePages(pages: NuxtPage[]) {
    const mapped = pages
      .map((page) => this.handlePage(page))
      .map((v) => v?.yml)
      .filter(nonNullable)
      .sort()

    this.templateContents = `keys:\n${mapped.join('\n')}`
  }

  getTemplateContents(): string {
    return this.templateContents
  }
}

export default defineVuepalFeature<{
  /**
   * The default language.
   */
  defaultLanguage: string

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
      const relativePath = relative(
        helper.paths.moduleBuildDir,
        helper.nuxt.options.workspaceDir +
          '/node_modules/nuxt/dist/pages/runtime/composables',
      )

      return `
declare module "${relativePath}" {
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
    if (!outputPath) {
      throw new Error(`Missing required option "frontendRouting.outputPath".`)
    }

    if (!options.defaultLanguage) {
      throw new Error(
        `Missing required option "frontendRouting.defaultLanguage".`,
      )
    }

    const languageNegotiationModuleIndex =
      helper.nuxt.options.modules.findIndex(
        (v) => v === 'nuxt-language-negotiation',
      )

    // Module is installed.
    if (languageNegotiationModuleIndex !== -1) {
      const vuepalIndex = helper.nuxt.options.modules.findIndex(
        (v) => v === 'vuepal',
      )

      // Make sure that nuxt-language-negotiation runs after vuepal, or else
      // the routes have already been translated.
      if (languageNegotiationModuleIndex < vuepalIndex) {
        throw new Error(
          'The "nuxt-language-negotiation" module must be put after "vuepal" in nuxt.config.ts',
        )
      }
    }

    const collector = new PageCollector(options.defaultLanguage)

    addTemplate({
      filename: helper.resolvers.root.resolve(options.outputPath),
      write: true,
      getContents: () => collector.getTemplateContents(),
    })

    helper.nuxt.options.experimental.scanPageMeta = true
    helper.nuxt.options.experimental.extraPageMetaExtractionKeys ||= []
    helper.nuxt.options.experimental.extraPageMetaExtractionKeys.push(
      'languageMapping',
      'drupalFrontendRoute',
    )

    extendPages((pages) => {
      collector.handlePages(pages)
    })
  },
})
