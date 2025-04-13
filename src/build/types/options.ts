import type { VuepalFeature } from './../features/defineFeature'
import type adminToolbar from './../features/adminToolbar'
import type devMode from './../features/devMode'
import type drupalRoute from './../features/drupalRoute'
import type frontendRouting from './../features/frontendRouting'
import type localTasks from './../features/localTasks'

export const COMPOSABLES = [
  'useClickTriggerProxy',
  'useQueryString',
  'useAnimationFrame',
] as const

export const COMPONENTS = [
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
