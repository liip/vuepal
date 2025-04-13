import { fileURLToPath } from 'node:url'
import { name, version } from '../package.json'
import { defineNuxtModule, hasNuxtModule, installModule } from '@nuxt/kit'
import type { VuepalFeature } from './build/features/defineFeature'
import { ModuleHelper } from './build/classes/ModuleHelper'
import adminToolbar from './build/features/adminToolbar'
import devMode from './build/features/devMode'
import drupalRoute from './build/features/drupalRoute'
import frontendRouting from './build/features/frontendRouting'
import localTasks from './build/features/localTasks'
import { logger } from './build/helpers'

const COMPOSABLES = [
  'useClickTriggerProxy',
  'useQueryString',
  'useAnimationFrame',
] as const

const COMPONENTS = [
  'VuepalRemoteVideo',
  'VuepalLink',
  'VuepalTransitionHeight',
] as const

type FeatureOptions<T> =
  T extends VuepalFeature<infer O>
    ? O & { enabled: boolean }
    : { enabled: boolean }

export type ModuleOptions = {
  /**
   * Provides a <VuepalAdminToolbar> component to render the Drupal toolbar.
   */
  adminToolbar?: FeatureOptions<typeof adminToolbar>

  /**
   * Provides features for local development.
   */
  devMode?: FeatureOptions<typeof devMode>

  /**
   * Provides the useDrupalRoute() composable to automatically handle
   * redirects and metatags.
   */
  drupalRoute?: FeatureOptions<typeof drupalRoute>

  /**
   * Provides a feature to have Nuxt pages be connected to a Node in Drupal.
   *
   * Enabling the feature requires setting the outputPath option.
   * The module will then generate the settings YML file for Drupal that
   * contains the aggregated routes where the frontend "dictates" the aliases
   * for all languages.
   */
  frontendRouting?: FeatureOptions<typeof frontendRouting>

  /**
   * Provides a component to render Drupal local tasks.
   */
  localTasks?: FeatureOptions<typeof localTasks>

  /**
   * Disable composables. By default all composables are included.
   */
  disabledComposables?: Partial<Array<(typeof COMPOSABLES)[number]>>

  /**
   * Disable components. By default all components are included.
   */
  disabledComponents?: Partial<Array<(typeof COMPONENTS)[number]>>
}

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
      await installModule('nuxt-graphql-middleware', {
        downloadSchema: false,
        graphqlEndpoint: 'http://starterkit.ddev.site/de/graphql',
        schemaPath: './playground/schema.graphql',
      })
      await installModule('nuxt-language-negotiation', {
        availableLanguages: ['de', 'en'],
      })
    }

    const helper = new ModuleHelper(nuxt, import.meta.url, {
      debug: true,
      isModuleBuild,
    })

    // Each feature can throw an error, for example when types or fields are
    // missing from the GraphQL schema.
    try {
      if (options.adminToolbar?.enabled || helper.isModuleBuild) {
        adminToolbar.setup(helper, options.adminToolbar)
      }

      if (options.devMode?.enabled || helper.isModuleBuild) {
        devMode.setup(helper, options.devMode)
      }

      if (options.drupalRoute?.enabled || helper.isModuleBuild) {
        drupalRoute.setup(helper, options.drupalRoute)
      }

      if (options.frontendRouting?.enabled || helper.isModuleBuild) {
        frontendRouting.setup(helper, options.frontendRouting)
      }

      if (options.localTasks?.enabled || helper.isModuleBuild) {
        localTasks.setup(helper, options.localTasks)
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.box(e.message)
      }

      throw new Error('Failed to initialise vuepal.')
    }

    helper.inlineNitroExternals(
      fileURLToPath(new URL('./runtime', import.meta.url)),
    )

    helper.addAlias(
      '#vuepal/types',
      helper.resolvers.module.resolve('runtime/types'),
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
