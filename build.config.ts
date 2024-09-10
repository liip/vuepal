import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
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
  ],
})
