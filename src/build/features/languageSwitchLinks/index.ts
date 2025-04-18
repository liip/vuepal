import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'languageSwitchLinks',
  description: 'Adds support for language links.',
  setup(helper) {
    helper.assertGraphqlObjectField(
      { extension: 'language_switch_links' },
      'EntityUrl',
      'languageSwitchLinks',
    )

    helper.addComposable('useLanguage')
    helper.addPlugin('languageSwitchLinks')
    helper.addGraphqlFile('fragment.languageSwitchLink.graphql')
  },
})
