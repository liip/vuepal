import { fileURLToPath } from 'node:url'
import { defu } from 'defu'
import {
  createResolver,
  defineNuxtModule,
  addTemplate,
  addImports,
  addComponent,
} from '@nuxt/kit'
import { fileExists } from './helpers'
import type { VuepalModuleContext } from './types'
import frontendRouting, {
  type VuepalFrontendRoutingOptions,
} from './frontendRouting'
import adminToolbar, { type VuepalAdminToolbarOptions } from './adminToolbar'
import localTasks, { type VuepalLocalTasksOptions } from './localTasks'
import drupalRoute, { type VuepalDrupalRouteOptions } from './drupalRoute'
import devMode, { type VuepalDevModeOptions } from './devMode'

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

export type ModuleOptions = {
  /**
   * Provides a feature to have Nuxt pages be connected to a Node in Drupal.
   *
   * Enabling the feature requires setting the outputPath option.
   * The module will then generate the settings YML file for Drupal that
   * contains the aggregated routes where the frontend "dictates" the aliases
   * for all languages.
   */
  frontendRouting?: VuepalFrontendRoutingOptions

  /**
   * Provides a <VuepalAdminToolbar> component to render the Drupal toolbar.
   */
  adminToolbar?: VuepalAdminToolbarOptions

  /**
   * Provides a component to render Drupal local tasks.
   */
  localTasks?: VuepalLocalTasksOptions

  /**
   * Provides the useDrupalRoute() composable to automatically handle
   * redirects and metatags.
   */
  drupalRoute?: VuepalDrupalRouteOptions

  /**
   * Provides features for local development.
   */
  devMode?: VuepalDevModeOptions

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
    name: 'nuxt-vuepal',
    configKey: 'vuepal',
    version: '1.0.0',
    compatibility: {
      nuxt: '^3.1.0',
    },
  },
  defaults: {},
  setup(options, nuxt) {
    // The path to the source directory of this module's consumer.
    const srcDir = nuxt.options.srcDir
    const srcResolver = createResolver(srcDir)

    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Transpile all runtime code.
    nuxt.options.build.transpile.push(runtimeDir)

    // Add alias for vuepal types.
    nuxt.options.alias['#vuepal/types'] = resolve('runtime/types')

    const helpers = ['array', 'graphql', 'type', 'url', 'string', 'video']

    helpers.forEach((helper) => {
      nuxt.options.alias['#vuepal/helpers/' + helper] = resolve(
        'runtime/helpers/' + helper,
      )
    })

    // Alias for the compiled styles.
    nuxt.options.alias['#vuepal/styles'] = resolve('./runtime/css/output.css')

    // Setup adapter.
    const resolvedPath = '~/app/vuepal.adapter'
      .replace(/^(~~|@@)/, nuxt.options.rootDir)
      .replace(/^(~|@)/, nuxt.options.srcDir)
    const adapterTemplate = (() => {
      const maybeUserFile = fileExists(resolvedPath, ['ts'])

      if (!maybeUserFile) {
        throw new Error(
          'Missing Vuepal adapter file in ~/app/vuepal.adapter.ts',
        )
      }
      return addTemplate({
        filename: 'vuepal/adapter.ts',
        write: true,
        getContents: () => `
import type { VuepalAdapter } from '#vuepal/types'
import adapter from './../../app/vuepal.adapter'
export default adapter`,
      })
    })()

    nuxt.options.alias['#vuepal/adapter'] = adapterTemplate.dst

    // Context object for all feature modules.
    const ctx: VuepalModuleContext = {
      resolve,
      nuxt,
      srcDir,
      srcResolver,
    }

    if (options.drupalRoute?.enabled) {
      drupalRoute(ctx, options.drupalRoute)
    }

    if (options.localTasks?.enabled) {
      localTasks(ctx, options.localTasks)
    }

    if (options.adminToolbar?.enabled) {
      adminToolbar(
        ctx,
        options.adminToolbar || {
          enabled: true,
        },
      )
    }

    if (options.devMode?.enabled) {
      devMode(ctx, options.devMode)
    }

    if (options.frontendRouting?.enabled) {
      frontendRouting(ctx, options.frontendRouting)
    }

    // Needed because Nitro.
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.externals = defu(
        typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {},
        {
          inline: [resolve('./runtime')],
        },
      )
    })

    const disabledComposables = options.disabledComposables || []
    COMPOSABLES.forEach((name) => {
      if (disabledComposables.includes(name)) {
        return
      }
      addImports({
        from: resolve('./runtime/composables/' + name),
        name,
      })
    })

    const disabledComponents = options.disabledComponents || []

    COMPONENTS.forEach((name) => {
      if (disabledComponents.includes(name)) {
        return
      }
      addComponent({
        filePath: resolve(`./runtime/components/${name}/index`),
        name,
        global: true,
      })
    })
  },
})
