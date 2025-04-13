import type { VuepalAdapterFactory } from './runtime/types'

/**
 * Define the Vuepal adapter.
 *
 * This method should return an object that implements the methods required for the enabled features.
 */
export function defineVuepalAdapter(
  cb: VuepalAdapterFactory,
): VuepalAdapterFactory {
  return cb
}
