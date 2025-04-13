import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'localTasks',
  description: 'Provides a component and GraphQL query to display local tasks.',
  setup(helper) {
    helper
      .assertGraphqlObjectField({ extension: 'routing' }, 'InternalUrl')
      .assertGraphqlObjectField(
        { extension: 'local_tasks' },
        'InternalUrl',
        'localTasks',
      )

    helper.addComponent('VuepalLocalTasks')
    helper.addGraphqlFile('query.localTasks.graphql')
  },
})
