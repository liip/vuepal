import { addComponent, addTemplate } from '@nuxt/kit'
import type { VuepalModuleContext } from './types'

export type VuepalAdminToolbarOptions = {
  /**
   * Whether to include the admin toolbar component.
   */
  enabled: boolean

  /**
   * Provide additional admin toolbar icons or override existing ones.
   */
  adminToolbarIcons?: Record<string, string>
}

export default function (
  { nuxt, resolve }: VuepalModuleContext,
  options: VuepalAdminToolbarOptions,
) {
  const configTemplate = addTemplate({
    filename: 'vuepal/admin-config.ts',
    write: true,
    getContents: () => {
      const icons: Record<string, string> = {
        fallback: '/themes/contrib/gin/dist/media/sprite.svg#fallback-view',
        'system.admin_content':
          '/themes/contrib/gin/dist/media/sprite.svg#content-view',
        'system.admin_structure':
          '/themes/contrib/gin/dist/media/sprite.svg#structure-view',
        'system.themes_page':
          '/themes/contrib/gin/dist/media/sprite.svg#appearance-view',
        'system.modules_list':
          '/themes/contrib/gin/dist/media/sprite.svg#extend-view',
        'system.admin_config':
          '/themes/contrib/gin/dist/media/sprite.svg#config-view',
        'entity.group.collection':
          '/themes/contrib/gin/dist/media/sprite.svg#group-view',
        'entity.user.collection':
          '/themes/contrib/gin/dist/media/sprite.svg#people-view',
        'system.admin_reports':
          '/themes/contrib/gin/dist/media/sprite.svg#reports-view',
        'help.main': '/themes/contrib/gin/dist/media/sprite.svg#help-view',
        'commerce.admin_commerce':
          '/themes/contrib/gin/dist/media/sprite.svg#commerce-view',
        '<front>': '/themes/contrib/gin/dist/media/sprite.svg#gin-view',
        'tmgmt.admin_tmgmt':
          '/themes/contrib/gin/dist/media/sprite.svg#tmgmt-view',
        ...(options.adminToolbarIcons || {}),
      }
      return `
export const adminToolbarIcons: Record<string, string> = ${JSON.stringify(
        icons,
        null,
        2,
      )}
`
    },
  })
  nuxt.options.alias['#vuepal/admin-config'] = configTemplate.dst

  addComponent({
    filePath: resolve('./runtime/components/AdminToolbar/index'),
    name: 'VuepalAdminToolbar',
    global: true,
  })
}
