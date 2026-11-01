import {
  acceptLanguage,
  pathPrefix,
} from 'nuxt-language-negotiation/negotiators'

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    // Where the Nuxt server reaches Drupal. Set by NUXT_DRUPAL_URL in ddev.
    drupalUrl: 'http://localhost',
  },
  modules: [
    'nuxt-graphql-middleware',
    '../src/module',
    'nuxt-language-negotiation',
    '@nuxt/eslint',
  ],

  graphqlMiddleware: {
    autoImportPatterns: ['./app/**/*.graphql'],
    // To update schema.graphql from the test site, run
    // `ddev exec VUEPAL_DOWNLOAD_SCHEMA=1 npx nuxi prepare playground`.
    downloadSchema: !!process.env.VUEPAL_DOWNLOAD_SCHEMA,
    graphqlEndpoint: 'http://localhost/de/graphql',
    schemaPath: './../schema.graphql',

    codegenConfig: {
      skipUnusedFragments: false,
    },
  },

  imports: {
    autoImport: false,
  },

  typescript: {
    includeWorkspace: false,
  },

  experimental: {
    scanPageMeta: 'after-resolve',
    // Like the starterkit. useDrupalRouteQuery() calls useDrupalRoute() after
    // an await, which needs the async context during SSR.
    asyncContext: true,
  },

  languageNegotiation: {
    languages: ['de', 'en'],
    negotiators: [acceptLanguage(), pathPrefix()],
  },

  app: {
    head: {
      viewport:
        'width=device-width, height=device-height, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0',
    },
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      'postcss-mixins': {},
      'postcss-nested-import': {},
      'tailwindcss/nesting': {},
      'postcss-url': {},
      tailwindcss: {},
      cssnano: {
        preset: 'default',
      },
    },
  },

  vuepal: {
    adminToolbar: {
      enabled: true,
    },
    localTasks: {
      enabled: true,
    },
    frontendRouting: {
      enabled: true,
      defaultLanguage: 'de',
      // Imported by the recipe of the test site.
      outputPath: './../drupal/recipe/config/frontend_routing.settings.yml',
    },
    drupalRoute: {
      enabled: true,
      routeQueries: {
        nodeCanonical: {
          fragments: ['nodePage', 'nodeArticle'] as never[],
        },
      },
    },
    languageSwitchLinks: {
      enabled: true,
    },
    breadcrumb: {
      enabled: true,
    },
    trustedOrigins: {
      enabled: true,
      // http://vuepal.ddev.site is not trusted, the E2E tests use it to check
      // the redirect.
      origins: ['https://vuepal.ddev.site'],
      redirectUrl: 'https://vuepal.ddev.site',
    },
  },

  vite: {
    server: {
      // The dev server runs behind ddev's nginx.
      allowedHosts: ['vuepal.ddev.site'],
    },
  },

  compatibilityDate: '2026-03-15',

  future: {
    compatibilityVersion: 4,
  },
})
