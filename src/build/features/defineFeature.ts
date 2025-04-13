import type { ModuleHelper } from '../classes/ModuleHelper'

export type VuepalFeature<O extends object = never> = {
  name: string
  description: string
  setup: (helper: ModuleHelper, options?: O) => Promise<void> | void
}

export function defineVuepalFeature<O extends object>(
  feature: VuepalFeature<O>,
): VuepalFeature<O> {
  return feature
}
