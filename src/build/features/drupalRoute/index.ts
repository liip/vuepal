import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'drupalRoute',
  description: 'Adds routing related GraphQL queries and composables.',
  setup(helper) {
    helper
      .assertGraphqlObjectField({ extension: 'routing' }, 'Query', 'route')
      .assertGraphqlObjectField(
        { extension: 'metatags' },
        'InternalUrl',
        'metatags',
      )
      .assertGraphqlEntityBaseField('uuid')
      .assertGraphqlEntityBaseField('entityBundle')
      .assertGraphqlEntityBaseField('entityTypeId')
      .assertGraphqlEntityBaseField('id')

    helper.addComposable('useDrupalRoute')
    helper.addComposable('buildDrupalMetatags')
    helper.addGraphqlFile('fragment.drupalRoute.graphql')
  },
})
