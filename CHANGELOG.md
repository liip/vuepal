# Changelog

## v3.1.0

[compare changes](https://github.com/liip/vuepal/compare/1cd7a3b1...v3.1.0)

### 🚀 Enhancements

- Expose redirect target in useDrupalRoute context ([b4b32e49](https://github.com/liip/vuepal/commit/b4b32e49))
- Check the entity type in route queries, add queryFragments ([67433e03](https://github.com/liip/vuepal/commit/67433e03))
- Add an agent skill for route queries ([8a4ba79f](https://github.com/liip/vuepal/commit/8a4ba79f))

### 🩹 Fixes

- Do not throw 404 for redirect routes in useDrupalRouteQuery ([74e50a7e](https://github.com/liip/vuepal/commit/74e50a7e))
- Call composables in useDrupalRouteQuery() before awaiting the query ([01e8bdb6](https://github.com/liip/vuepal/commit/01e8bdb6))
- Render the matches of the command palette with interpolation ([f78e2699](https://github.com/liip/vuepal/commit/f78e2699))
- Accept only valid YouTube IDs ([bbc25a46](https://github.com/liip/vuepal/commit/bbc25a46))
- Ship the Vue components compiled to JavaScript ([07208c45](https://github.com/liip/vuepal/commit/07208c45))

### 💅 Refactors

- Use the redirect URL from useDrupalRoute for the redirect and the 404 check ([c8793825](https://github.com/liip/vuepal/commit/c8793825))

### 📖 Documentation

- Check for duplicate document names in the route queries skill ([9149038b](https://github.com/liip/vuepal/commit/9149038b))
- Cover empty pages with a 200 in the route queries skill ([8783ffa6](https://github.com/liip/vuepal/commit/8783ffa6))

### 🏡 Chore

- Use auto-imported components in the playground pages ([8d6fb754](https://github.com/liip/vuepal/commit/8d6fb754))
- Add CLAUDE.md ([25e4f318](https://github.com/liip/vuepal/commit/25e4f318))
- Build the styles in ddev setup ([0e4855d0](https://github.com/liip/vuepal/commit/0e4855d0))
- Update the GitHub actions to v7 ([7fa6a268](https://github.com/liip/vuepal/commit/7fa6a268))

### ✅ Tests

- Add E2E tests against a minimal Drupal test site ([9ca5aa4e](https://github.com/liip/vuepal/commit/9ca5aa4e))
- Cover all paths of useDrupalRoute() and test the build locally ([0bfcafc5](https://github.com/liip/vuepal/commit/0bfcafc5))

### ❤️ Contributors

- Jan Hug <me@dulnan.net>
- Jon Minder ([@ayalon](https://github.com/ayalon))

## v3.0.6

[compare changes](https://github.com/liip/vuepal/compare/v3.0.5...v3.0.6)

### 🩹 Fixes

- Remove unresolvable useLanguage auto-import ([95361b0](https://github.com/liip/vuepal/commit/95361b0))

### ❤️ Contributors

- Jon Minder <jonathan.minder@liip.ch>

## v3.0.5

[compare changes](https://github.com/liip/vuepal/compare/v3.0.4...v3.0.5)

### 🚀 Enhancements

- Add option to disable default fragments ([670b52e](https://github.com/liip/vuepal/commit/670b52e))

### ❤️ Contributors

- Jan Hug <me@dulnan.net>

## v3.0.4

[compare changes](https://github.com/liip/vuepal/compare/v3.0.3...v3.0.4)

### 🩹 Fixes

- add support for GraphqlDrupalMetatags back to buildDrupalMetatags ([597e8d4](https://github.com/liip/vuepal/commit/597e8d4))
- Newline in frontend_routing.settings.yml ([af4a271](https://github.com/liip/vuepal/commit/af4a271))

### ❤️ Contributors

- Milan Bombsch <milan.bombsch@liip.ch>
- Jan Hug <me@dulnan.net>

## v3.0.3

[compare changes](https://github.com/liip/vuepal/compare/v3.0.2...v3.0.3)

### 🩹 Fixes

- Throw http 500 when route query fails ([582e730](https://github.com/liip/vuepal/commit/582e730))

### 🏡 Chore

- Nuxt 4.0.0 compatibility ([cac84fa](https://github.com/liip/vuepal/commit/cac84fa))

### ❤️ Contributors

- Jan Hug <me@dulnan.net>

## v3.0.1

[compare changes](https://github.com/liip/vuepal/compare/v2.5.5...v3.0.1)

### 🚀 Enhancements

- Nuxt-graphql-middleware schema validation ([6993dce](https://github.com/liip/vuepal/commit/6993dce))
- Improve performance when building frontend routing yml ([5ddcffe](https://github.com/liip/vuepal/commit/5ddcffe))
- Nuxt 4 compatibility ([cf1b385](https://github.com/liip/vuepal/commit/cf1b385))
- Trusted origins plugin ([64813e1](https://github.com/liip/vuepal/commit/64813e1))
- Breadcrumb, languageSwitchLinks feature ([96bceb5](https://github.com/liip/vuepal/commit/96bceb5))
- Dynamic useGraphqlRouteQuery ([7a99a1c](https://github.com/liip/vuepal/commit/7a99a1c))
- Improve route queries, types ([004e17e](https://github.com/liip/vuepal/commit/004e17e))
- Use "native" page meta extraction ([172b340](https://github.com/liip/vuepal/commit/172b340))
- SchemaOrgMetatags support ([c1f4859](https://github.com/liip/vuepal/commit/c1f4859))

### 🩹 Fixes

- Strict typecheck ([2061fcf](https://github.com/liip/vuepal/commit/2061fcf))
- PageMeta type augmentation ([50a4b3b](https://github.com/liip/vuepal/commit/50a4b3b))
- Redirect query parameters ([592e679](https://github.com/liip/vuepal/commit/592e679))
- Handle redirects only once in useDrupalRoute ([9b6e7ff](https://github.com/liip/vuepal/commit/9b6e7ff))
- Adapt to new nuxt-language-negotiation version ([06f0b48](https://github.com/liip/vuepal/commit/06f0b48))
- UseDrupalRouteQuery reactivity ([0aba3d2](https://github.com/liip/vuepal/commit/0aba3d2))

### 💅 Refactors

- Module structure, Nuxt 4 compatibility ([102e84f](https://github.com/liip/vuepal/commit/102e84f))

### 🏡 Chore

- **release:** V2.5.5 ([5b4bb8c](https://github.com/liip/vuepal/commit/5b4bb8c))
- Upgrade guide ([a84e728](https://github.com/liip/vuepal/commit/a84e728))
- Release v3.0.0 ([2b3baf1](https://github.com/liip/vuepal/commit/2b3baf1))

### ❤️ Contributors

- Jan Hug <me@dulnan.net>
- Ayalon <info@ayalon.ch>

## v2.5.5

[compare changes](https://github.com/liip/vuepal/compare/v2.5.4...v2.5.5)

### 🩹 Fixes

- Typescript issue resolved.
  ([7ad769b](https://github.com/liip/vuepal/commit/7ad769b))

### ❤️ Contributors

- Ayalon <info@ayalon.ch>

## v2.5.4

[compare changes](https://github.com/liip/vuepal/compare/v2.5.3...v2.5.4)

### 🩹 Fixes

- Remove unwanted styles
  ([cf99c13](https://github.com/liip/vuepal/commit/cf99c13))

### ❤️ Contributors

- Ayalon <info@ayalon.ch>

## v2.5.3

[compare changes](https://github.com/liip/vuepal/compare/v2.5.2...v2.5.3)

## v2.5.2

[compare changes](https://github.com/liip/vuepal/compare/v2.5.1...v2.5.2)

### 🏡 Chore

- **release:** V2.5.1 ([50eb6a2](https://github.com/liip/vuepal/commit/50eb6a2))

### ❤️ Contributors

- Ayalon <info@ayalon.ch>

## v2.5.1
