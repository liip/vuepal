import { addImports } from '@nuxt/kit'
import type { VuepalModuleContext } from './types'

export type VuepalDrupalRouteOptions = {
  /**
   * Whether to include the useDrupalRoute composable.
   */
  enabled: boolean
}

export default function (
  { resolve }: VuepalModuleContext,
  _options: VuepalDrupalRouteOptions,
) {
  addImports({
    from: resolve('./runtime/composables/useDrupalRoute'),
    name: 'useDrupalRoute',
  })

  addImports({
    from: resolve('./runtime/composables/buildDrupalMetatags'),
    name: 'buildDrupalMetatags',
  })
}
