import { addPlugin } from '@nuxt/kit'
import type { VuepalModuleContext } from './types'

export type VuepalDevModeOptions = {
  /**
   * Whether to enable the dev mode feature.
   */
  enabled: boolean

  /**
   * The local development URL.
   *
   * @example https://vuepal.lndo.site
   */
  url: string

  /**
   * Force redirecting to HTTPS during local development.
   */
  forceHttps?: boolean
}

export default function (
  { nuxt, resolve }: VuepalModuleContext,
  options: VuepalDevModeOptions,
) {
  // This module only does things in dev mode.
  if (!nuxt.options.dev) {
    return
  }

  if (options.forceHttps) {
    // Add the plugin that force redirects to https.
    addPlugin(resolve('runtime/plugins/forceHttps'))
  }

   
  console.log(`\n\n> Visit ${options.url} and start developing!\n\n`)
}
