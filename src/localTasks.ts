import { addComponent } from '@nuxt/kit'
import type { VuepalModuleContext } from './types'

export type VuepalLocalTasksOptions = {
  /**
   * Whether to include the <LocalTasks> component.
   */
  enabled: boolean
}

export default function (
  { resolve }: VuepalModuleContext,
  _options: VuepalLocalTasksOptions,
) {
  addComponent({
    filePath: resolve('./runtime/components/LocalTasks/index'),
    name: 'VuepalLocalTasks',
    global: true,
  })
}
