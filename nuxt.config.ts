import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  modules: [
    'nuxt-graphql-middleware',
    './src/module',
    'nuxt-language-negotiation',
  ],
  typescript: {
    strict: true,
    tsConfig: {
      exclude: ['../playground', '../src/build'],
    },
    nodeTsConfig: {
      exclude: ['../src/adapter.ts'],
    },
  },
  graphqlMiddleware: {
    autoImportPatterns: ['./playground/app/**/*.graphql'],
    downloadSchema: false,
    graphqlEndpoint: 'http://starterkit.ddev.site/de/graphql',
    schemaPath: './schema.graphql',
  },
  languageNegotiation: {
    languages: ['de', 'en'],
    negotiators: [],
  },
  compatibilityDate: '2024-09-10',
})
