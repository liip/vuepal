export default defineNuxtConfig({
  ssr: false,
  modules: ['../src/module', 'nuxt-language-negotiation'],

  imports: {
    autoImport: false,
  },

  experimental: {
    scanPageMeta: true,
  },

  languageNegotiation: {
    // Define the available languages.
    availableLanguages: ['de', 'en'],
    defaultLanguageNoPrefix: false,

    negotiators: ['pathPrefix', 'acceptLanguage'],
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
      langcodes: ['de', 'en'],
      outputPath: './../drupal/frontend_routing.settings.yml',
    },
  },

  compatibilityDate: '2024-09-10',
})
