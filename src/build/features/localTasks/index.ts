import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'localTasks',
  description: 'Provides a component and GraphQL query to display local tasks.',
  setup(helper) {
    helper.addComponent('VuepalLocalTasks')
  },
})
