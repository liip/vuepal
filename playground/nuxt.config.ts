import {
  acceptLanguage,
  pathPrefix,
} from 'nuxt-language-negotiation/negotiators'

export default defineNuxtConfig({
  ssr: false,
  devtools: {
    enabled: true,
  },
  modules: [
    'nuxt-graphql-middleware',
    '../src/module',
    'nuxt-language-negotiation',
    '@nuxt/eslint',
  ],

  graphqlMiddleware: {
    autoImportPatterns: ['./app/**/*.graphql'],
    // For local development:
    // Set this to true to update the schema.
    // Make sure the starterkit app is running.
    downloadSchema: false,
    graphqlEndpoint: 'http://starterkit.ddev.site/de/graphql',
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
      outputPath: './../drupal/frontend_routing.settings.yml',
    },
    drupalRoute: {
      enabled: true,
      routeQueries: {
        nodeCanonical: {
          fragments: ['nodePage'] as never[],
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
      origins: [
        'http://localhost:3001',
        'http://localhost:3004',
        'http://localhost:3000',
        'https://localhost:3000',
      ],
      redirectUrl: 'https://localhost:3000',
    },
  },

  compatibilityDate: '2026-03-15',

  future: {
    compatibilityVersion: 4,
  },
})
