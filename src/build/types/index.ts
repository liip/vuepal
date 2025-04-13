import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

export type VuepalModuleContext = {
  resolve: (...path: string[]) => string
  nuxt: Nuxt
  srcDir: string
  srcResolver: Resolver
}
