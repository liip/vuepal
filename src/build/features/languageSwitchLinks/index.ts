import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature<{
  /**
   * Add the default languageSwitchLink fragment.
   *
   * If false, you will have to define your own fragment in your project.
   *
   * @default true
   */
  addFragment?: boolean
}>({
  name: 'languageSwitchLinks',
  description: 'Adds support for language links.',
  setup(helper, options) {
    helper.assertGraphqlObjectField(
      { extension: 'language_switch_links' },
      'EntityUrl',
      'languageSwitchLinks',
    )

    helper.addComposable('useLanguage')
    helper.addPlugin('languageSwitchLinks')

    if (options?.addFragment !== false) {
      helper.addGraphqlFile('fragment.languageSwitchLink.graphql')
    }
  },
})
