import { fileURLToPath } from 'node:url'
import { name, version } from '../package.json'
import { defineNuxtModule, hasNuxtModule } from '@nuxt/kit'
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
      nuxt: '>=3.15.0',
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

    // When building the module types during development, ensure strict
    // TypeScript settings are applied. The required modules
    // (nuxt-graphql-middleware, nuxt-language-negotiation) are now registered
    // in the root nuxt.config.ts.
    if (isModuleBuild) {
      nuxt.options.typescript.strict = true
      nuxt.options.typescript.tsConfig.compilerOptions ||= {}
      nuxt.options.typescript.tsConfig.compilerOptions.noUncheckedIndexedAccess =
        true
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
