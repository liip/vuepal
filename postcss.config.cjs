function scopePreflight(container = '.vuepal-root') {
  const creator = () => ({
    postcssPlugin: 'scope-preflight',
    Once(root) {
      root.walkRules((rule) => {
        if (!rule.selector) return
        const s = rule.selector.replace(/\s+/g, ' ').trim()
        const isRootOrHost =
          /^:root(?:\s*,\s*:host)?$|^:host(?:\s*,\s*:root)?$/.test(s)
        const isUniversal =
          /^\*,\s*::?before,\s*::?after(?:,\s*::backdrop)?$/.test(s)
        const isBackdrop = /^::backdrop$/.test(s)

        if (isRootOrHost) {
          rule.selector = container
        } else if (isUniversal) {
          rule.selector = `${container} *, ${container} ::before, ${container} ::after`
        } else if (isBackdrop) {
          rule.selector = `${container} ::backdrop`
        }
      })
    },
  })
  creator.postcss = true
  return creator
}

module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-nested-import'),
    require('tailwindcss/nesting'),
    require('postcss-url'),
    require('tailwindcss'),
    require('cssnano')({
      preset: 'default',
    }),
    require('postcss-replace')({
      pattern: /(--tw|\*, ::before, ::after)/g,
      data: {
        '--tw': '--vuepal-tw',
        '*, ::before, ::after': ':root',
      },
    }),
    scopePreflight('.vuepal-root'),
  ],
}
