import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'drupalRoute',
  description: 'Adds routing related GraphQL queries and composables.',
  setup(helper) {
    helper.addComposable('useDrupalRoute')
    helper.addComposable('buildDrupalMetatags')
  },
})
