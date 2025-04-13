import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature<{
  /**
   * Provide additional admin toolbar icons or override existing ones.
   */
  adminToolbarIcons?: Record<string, string>
}>({
  name: 'adminToolbar',
  description:
    'Provides a component and GraphQL query to display a Drupal Admin Toolbar.',
  setup(helper, options) {
    helper.addTemplate(
      'admin-config',
      () => {
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
          ...(options?.adminToolbarIcons || {}),
        }

        return `export const adminToolbarIcons = ${JSON.stringify(icons, null, 2)}`
      },
      () => {
        return `
declare module '#vuepal-build/admin-config' {
  export const adminToolbarIcons: Record<string, string>
}
`
      },
    )

    helper.addComponent('VuepalAdminToolbar')
  },
})
