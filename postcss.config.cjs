/* eslint-disable */
module.exports = {
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
    'postcss-replace': {
      pattern: /(--tw|\*, ::before, ::after)/g,
      data: {
        '--tw': '--vuepal-tw',
        '*, ::before, ::after': ':root',
      },
    },
  },
}
