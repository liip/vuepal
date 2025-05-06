import { fileURLToPath } from 'node:url'
import { name, version } from '../package.json'
import { defineNuxtModule, hasNuxtModule, installModule } from '@nuxt/kit'
import { ModuleHelper } from './build/classes/ModuleHelper'
import { FEATURE_KEYS, FEATURES } from './build/features'
import { logger } from './build/helpers'
import {
  COMPONENTS,
  COMPOSABLES,
  type ModuleOptions,
} from './build/types/options'

export type { ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    configKey: 'vuepal',
    version,
    compatibility: {
      nuxt: '^3.15.0',
    },
  },
  defaults: {},
  async setup(options, nuxt) {
    const isModuleBuild = process.env.PLAYGROUND_MODULE_BUILD === 'true'

    if (!hasNuxtModule('nuxt-graphql-middleware') && !isModuleBuild) {
      throw new Error(
        `The "vuepal" module requires the "nuxt-graphql-middleware" module to be installed.`,
      )
    }

    // This block is only needed when building the types for the module itself
    // during development. Nuxt does not use the playground's nuxt.config.ts to
    // determine which modules should be installed. For this reason we need to
    // manually install them. Note that this code is never executed on actual
    // installations of this module.
    if (isModuleBuild) {
      nuxt.options.typescript.strict = true
      nuxt.options.typescript.tsConfig.compilerOptions ||= {}
      nuxt.options.typescript.tsConfig.compilerOptions.noUncheckedIndexedAccess =
        true
      await installModule('nuxt-graphql-middleware', {
        downloadSchema: false,
        graphqlEndpoint: 'http://starterkit.ddev.site/de/graphql',
        schemaPath: './schema.graphql',
        autoImportPatterns: ['./playground/app/**/*.graphql'],
      })
      await installModule('nuxt-language-negotiation', {
        languages: ['de', 'en'],
        negotiators: [],
      })
    }

    const helper = new ModuleHelper(nuxt, options, import.meta.url, {
      debug: true,
      isModuleBuild,
    })

    // Each feature can throw an error, for example when types or fields are
    // missing from the GraphQL schema.
    try {
      FEATURE_KEYS.forEach((key) => {
        const featureOptions = options[key]
        if (featureOptions?.enabled || helper.isModuleBuild) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          FEATURES[key].setup(helper, featureOptions as any)
        }
      })
    } catch (e) {
      if (e instanceof Error) {
        logger.box(e.message)
      }

      throw new Error('Failed to initialise vuepal.')
    }

    helper.inlineNitroExternals(
      fileURLToPath(new URL('./runtime', import.meta.url)),
    )

    helper.addAlias('#vuepal-build', helper.paths.moduleBuildDir)

    helper.addAlias(
      '#vuepal/helpers',
      helper.resolvers.module.resolve('runtime/helpers'),
    )

    helper.addTemplate(
      'adapter',
      () => {
        const pathRelative = helper.toModuleBuildRelative(
          helper.paths.vuepalAdapterFile,
        )
        return `
import createAdapter from '${pathRelative}'
export { createAdapter }
`
      },
      () => {
        return `import type { VuepalAdapterFactory } from '${helper.paths.runtimeTypes}'

declare module '#vuepal-build/adapter' {
  export const createAdapter: VuepalAdapterFactory
}
`
      },
    )

    const disabledComposables = options.disabledComposables || []
    COMPOSABLES.forEach((name) => {
      if (disabledComposables.includes(name)) {
        return
      }
      helper.addComposable(name)
    })

    const disabledComponents = options.disabledComponents || []

    COMPONENTS.forEach((name) => {
      if (disabledComponents.includes(name)) {
        return
      }
      helper.addComponent(name)
    })

    helper.applyBuildConfig()
  },
})
