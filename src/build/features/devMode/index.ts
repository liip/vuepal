import { logger } from '../../helpers'
import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature<{
  /**
   * The local development URL.
   *
   * @example https://vuepal.lndo.site
   */
  url: string

  /**
   * Force redirecting to HTTPS during local development.
   */
  forceHttps?: boolean
}>({
  name: 'devMode',
  description: 'Provides features for local development.',
  setup(helper, options) {
    if (!helper.isDev) {
      return
    }

    if (options?.forceHttps) {
      helper.addPlugin('forceHttps')
    }

    if (options?.url) {
      logger.box(`Visit ${options.url} and start developing!`)
    }
  },
})
