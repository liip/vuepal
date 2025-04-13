import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/adapter.ts'],
  externals: [
    '#imports',
    'defu',
    'unplugin',
    'magic-string',
    'estree-walker',
    'acorn',
    'pathe',
    'webpack-sources',
    'webpack-virtual-modules',
    '@jridgewell/sourcemap-codec',
    'graphql',
    'nuxt-graphql-middleware/utils',
    /#vuepal-build/,
    /#nuxt-graphql-middleware/,
    /#graphql-operations/,
  ],
  replace: {
    'process.env.PLAYGROUND_MODULE_BUILD': 'undefined',
  },
})
