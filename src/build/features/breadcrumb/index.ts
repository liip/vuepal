import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature<{
  /**
   * Add the default breadcrumb fragment.
   *
   * If false, you will have to define your own fragment in your project.
   *
   * @default true
   */
  addFragment?: boolean
}>({
  name: 'breadcrumb',
  description: 'Adds support for breadcrumbs.',
  setup(helper, options) {
    helper.assertGraphqlObjectField(
      { extension: 'breadcrumb' },
      'EntityUrl',
      'breadcrumb',
    )

    helper.addComposable('useBreadcrumb')
    helper.addComponent('VuepalBreadcrumb')
    helper.addPlugin('breadcrumb')

    // We default to true.
    if (options?.addFragment !== false) {
      helper.addGraphqlFile('fragment.breadcrumb.graphql')
    }
  },
})
