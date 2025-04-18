import type { VuepalFeature } from './../features/defineFeature'
import type { FEATURES } from '../features'

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

export type ModuleOptionsFeatures = {
  [K in keyof typeof FEATURES]?: FeatureOptions<(typeof FEATURES)[K]>
}

export type ModuleOptions = ModuleOptionsFeatures & {
  /**
   * Disable composables. By default all composables are included.
   */
  disabledComposables?: Partial<Array<(typeof COMPOSABLES)[number]>>

  /**
   * Disable components. By default all components are included.
   */
  disabledComponents?: Partial<Array<(typeof COMPONENTS)[number]>>
}
