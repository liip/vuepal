import adminToolbar from './adminToolbar'
import devMode from './devMode'
import drupalRoute from './drupalRoute'
import frontendRouting from './frontendRouting'
import localTasks from './localTasks'
import trustedOrigins from './trustedOrigins'
import breadcrumb from './breadcrumb'
import languageSwitchLinks from './languageSwitchLinks'

export const FEATURES = {
  /**
   * Provides a component and GraphQL query to display a Drupal Admin Toolbar.
   */
  adminToolbar,

  /**
   *Provides features for local development.
   */
  devMode,

  /**
   *Adds routing related GraphQL queries and composables.
   */
  drupalRoute,

  /**
   * Integration with the drupal/frontend_routing Drupal module.
   */
  frontendRouting,

  /**
   * Provides a component and GraphQL query to display local tasks.
   */
  localTasks,

  /**
   * Provides a plugin and composable to verify the origin in the browser.
   */
  trustedOrigins,

  /**
   * Provides a component and fragment to display Drupal breadcrumbs.
   */
  breadcrumb,

  /**
   * Provides a component and fragment to display language switch links.
   */
  languageSwitchLinks,
}

export type ValidFeature = keyof typeof FEATURES

export const FEATURE_KEYS = Object.keys(FEATURES) as ValidFeature[]
