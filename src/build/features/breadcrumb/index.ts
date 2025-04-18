import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'breadcrumb',
  description: 'Adds support for breadcrumbs.',
  setup(helper) {
    helper.assertGraphqlObjectField(
      { extension: 'breadcrumb' },
      'EntityUrl',
      'breadcrumb',
    )

    helper.addComposable('useBreadcrumb')
    helper.addComponent('VuepalBreadcrumb')
    helper.addPlugin('breadcrumb')
    helper.addGraphqlFile('fragment.breadcrumb.graphql')
  },
})
