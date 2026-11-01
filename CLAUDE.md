# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

vuepal is a Nuxt module (published to npm) that connects a Nuxt frontend to a
Drupal backend that exposes its GraphQL API through
`drupal/graphql_core_schema`. It builds on `nuxt-graphql-middleware` (required)
and `nuxt-language-negotiation`. `README.md` documents the features for users
and `UPGRADE.md` covers upgrading to 3.0.

## Commands

Setup after `npm ci`:

```bash
npm run styles:build   # Builds src/runtime/css/output.css (gitignored, required by the admin toolbar)
npm run dev:prepare    # Stub-builds the module and prepares the root and playground .nuxt dirs
```

Checks (CI runs all of them):

```bash
npm run lint           # ESLint, src/ only
npm run prettier       # Prettier, whole repo (prettier:fix to write)
npm run typecheck      # build, runtime, server, playground and e2e tsconfigs; each has its own typecheck:* script
npm run dev:build      # Production build of the playground
```

`typecheck:build`, `typecheck:runtime` and `typecheck:server` use the tsconfigs
in the root `.nuxt`, so they need a fresh `dev:prepare` first.
`typecheck:playground` also runs the type tests in `playground/app/type-tests`.
There are no unit tests: the E2E tests are the test suite.

Don't run `npm run release`. It publishes to npm and pushes tags.

## E2E tests and the test site

The playground runs against a minimal Drupal 11 site in `drupal/` with ddev.
Drupal and Nuxt share one host, `https://vuepal.ddev.site`. Nuxt runs inside the
ddev web container, so run Node commands there (`ddev npm run …`,
`ddev exec …`). Playwright runs on the host.

```bash
ddev setup                 # Reinstalls Drupal from scratch, installs node modules, runs styles:build and dev:prepare
ddev frontend              # Dev server (keep it running)
ddev frontend --build      # Production build, then serves it
npm run test:e2e           # Against the dev server
VUEPAL_E2E_BUILD=1 npm run test:e2e   # Against the production build (what CI tests)
npx playwright test test/e2e/redirect.spec.ts --project=ssr -g "redirects"   # A single test
```

- Verify changes to runtime code against both the dev server and the production
  build, because they behave differently. `VUEPAL_E2E_BUILD` must match the
  running server: `test/e2e/warmup.setup.ts` checks this and fails early if it
  doesn't.
- The Playwright projects `ssr` and `spa` run every spec twice. `spa` sends the
  `x-vuepal-spa` header. `playground/server/middleware/spa.ts` turns off SSR for
  that header or for a Drupal `SSESS` session cookie, the same way as the
  blökkli starterkit. The `setup` project logs in as `admin`/`admin` and warms
  up the server.
- `drupal/recipe/recipe.yml` defines the site: modules, config, and the GraphQL
  server with its graphql_core_schema extensions, entity types and fields.
  `drupal/content.php` creates the content the tests rely on: nodes, aliases,
  translations and redirects. Both are applied by `ddev setup`, so rerun it
  after changing either.
- `.ddev/nginx_full/nginx-site.conf` uses a regex to send Drupal's paths
  (GraphQL, user, admin, node forms, `sites/`, `core/`, …) to PHP. Everything
  else goes to Nuxt on port 3000. If the playground needs a new Drupal path,
  extend that regex. Never put ddev's generated-file signature comment in this
  file: if ddev finds it, ddev overwrites the file.
- During SSR, the playground forwards the cookie and the `x-forwarded-*` headers
  to Drupal (`playground/shared/forwardedHeaders.ts`, used by
  `playground/server/graphqlMiddleware.serverOptions.ts` and
  `playground/app/plugins/graphqlMiddleware.ts`). Without them, Drupal builds
  URLs with `http://localhost` and doesn't see the session.

## Architecture

### Features

`src/module.ts` loops over `FEATURES` (`src/build/features/index.ts`). Each
feature lives in `src/build/features/<name>/index.ts`, is defined with
`defineVuepalFeature()`, and is set up only when `vuepal.<name>.enabled` is
true. Its options type becomes part of `ModuleOptions` automatically.

At build time, a feature:

- Checks the project's GraphQL schema with `helper.assertGraphqlObjectField()`,
  `assertGraphqlEntityBaseField()` and similar. A failed check throws an error
  that names the Drupal extension, entity type or base field to enable.
- Registers GraphQL documents with nuxt-graphql-middleware: static files from
  `src/runtime/graphql` via `helper.addGraphqlFile()`, or generated ones via
  `helper.graphql.addDocument()`. For example, `drupalRoute` generates the
  `useDrupalRoute` fragment, which depends on the enabled features, and one
  query per `routeQueries` entry for `useDrupalRouteQuery()`.
- Adds runtime code through `ModuleHelper`
  (`src/build/classes/ModuleHelper.ts`), which resolves names by convention:
  - Composables: `src/runtime/composables/<name>/index.ts`
  - Components: `src/runtime/components/<Name>/index.vue` (registered globally)
  - Plugins: `src/runtime/plugins/<name>.ts`

`COMPOSABLES` and `COMPONENTS` in `src/build/types/options.ts` are always
registered unless the project disables them.

### Module build mode

`dev:prepare` sets `PLAYGROUND_MODULE_BUILD=true` and prepares the root Nuxt app
(`nuxt.config.ts`). In that mode every feature is enabled, and strict TypeScript
with `noUncheckedIndexedAccess` applies. This app produces the root `.nuxt`
tsconfigs that typecheck the module's own code.

Because every feature is enabled, `schema.graphql` must satisfy all of their
schema checks. `schema.graphql` is downloaded from the test site and committed.
To change it, extend the recipe, run `ddev setup`, then
`ddev exec VUEPAL_DOWNLOAD_SCHEMA=1 npx nuxi prepare playground`, then
`npx prettier --write schema.graphql`.

### Adapter

Projects provide `app/vuepal.adapter.ts`, built with `defineVuepalAdapter()`
from the `vuepal/adapter` export. The admin toolbar, the local tasks and the
current language get their data from it. The module exposes the adapter to
runtime code as `#vuepal-build/adapter`. The root `app/vuepal.adapter.ts` only
re-exports the playground's adapter, for module build mode.

### Frontend routing

The `frontendRouting` feature reads `drupalFrontendRoute` and `languageMapping`
from the `definePageMeta()` of each page. From them it writes a
`frontend_routing.settings.yml` for the Drupal `frontend_routing` module. In
this repo, the playground writes it to
`drupal/recipe/config/frontend_routing.settings.yml`. That file is committed and
imported by the recipe, so commit it whenever page meta changes.

### Runtime conventions

- Auto-imports are disabled (`.nuxtrc` and the playground config). Import
  composables explicitly from `#imports`. In playground pages, don't import
  components in `<script setup>`; let Nuxt auto-import them from the components
  dir. An explicit import gives "Invalid vnode type" warnings in dev SSR when
  the page's setup throws, for example a 404.
- In composables that `await`, call every composable (`useNuxtApp`, `useHead`,
  `useRoute`, …) before the first `await`. Projects aren't required to enable
  `experimental.asyncContext`. A composable called after an `await` crashes
  during SSR. On the client it runs outside the component, so after navigation
  the old metatags stay. `useDrupalRouteQuery()` follows this pattern: the
  synchronous `setupDrupalRoute()` runs before the await and
  `handleDrupalRoute()` after it
  (`src/runtime/composables/useDrupalRoute/internal.ts`).
- During SSR, layouts render before the page's async setup has resolved, so
  route-dependent UI that the layout renders shows empty. The playground renders
  its breadcrumb and language links in the page for this reason.
- The admin toolbar's styles are written in `css/index.css` (Tailwind 3, no
  preflight, scoped with `important: '.vuepal-root'`) and compiled into
  `src/runtime/css/output.css`.

## Commits

The changelog is generated by changelogen from conventional commit messages
(`fix:`, `feat:`, `test:`, `chore:`, …).
