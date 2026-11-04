import { updateTemplates } from '@nuxt/kit'
import { defineVuepalFeature } from '../defineFeature'
import { pascalCase, camelCase } from 'change-case'
import { RouteQueryBuilder } from './RouteQueryBuilder'

type DrupalRouteDefinition = {
  /**
   * Which fragments to include for the route entity.
   *
   * The fragments must exist in the project and they must target a type
   * that implements "Entity" (or "Entity" itself).
   *
   * The route query only accepts entities of the types that the fragments
   * target: for an entity of another type, useDrupalRouteQuery() throws a 404.
   *
   * Without fragments, the route query only loads the route and accepts
   * entities of any type.
   */
  fragments?: string[]
}

export default defineVuepalFeature<{
  /**
   * Define which route GraphQL queries to generate.
   *
   * Each property generates a query. The value defines which fragments to use.
   *
   * You can then use the route query using the useDrupalRouteQuery() composable.
   */
  routeQueries?: Record<string, DrupalRouteDefinition>

  /**
   * Fragments on Query that are spread into the useDrupalRoute fragment.
   *
   * Their fields are loaded by every route query, also by queries written in
   * the project that spread useDrupalRoute, and they are part of the
   * `routeQuery` of the vuepal:drupal-route hook. Use them for data that every
   * page needs, e.g. `messengerMessages`.
   *
   * The fragments can't use variables other than `$path`.
   */
  queryFragments?: string[]
}>({
  name: 'drupalRoute',
  description: 'Adds routing related GraphQL queries and composables.',
  setup(helper, options) {
    helper
      .assertGraphqlObjectField({ extension: 'routing' }, 'Query', 'route')
      .assertGraphqlObjectField(
        { extension: 'metatags' },
        'InternalUrl',
        'metatags',
      )
      .assertGraphqlEntityBaseField('uuid')
      .assertGraphqlEntityBaseField('entityBundle')
      .assertGraphqlEntityBaseField('entityTypeId')
      .assertGraphqlEntityBaseField('id')

    helper.addComposable('useDrupalRoute')
    helper.addComposable('buildDrupalMetatags')

    helper.addGraphqlFile('fragment.metatag.graphql')

    const routeSpreadParts: string[] = ['metatags { ...metatag }']

    if (helper.graphql.schemaHasType('SchemaMetatag')) {
      helper.addGraphqlFile('fragment.schemaMetatag.graphql')
      routeSpreadParts.push('schemaOrgMetatags { ...schemaMetatag }')
    }

    if (helper.hasFeatureEnabled('breadcrumb')) {
      routeSpreadParts.push('breadcrumb { ...breadcrumb }')
    }

    if (helper.hasFeatureEnabled('languageSwitchLinks')) {
      routeSpreadParts.push('languageSwitchLinks { ...languageSwitchLink }')
    }

    const routeSpreads = routeSpreadParts.join('\n      ')
    const querySpreads = (options?.queryFragments || [])
      .map((v) => '...' + v)
      .join('\n  ')

    helper.graphql.addDocument(
      'fragment.drupalRoute.graphql',
      `
fragment useDrupalRoute on Query {
  ${querySpreads}
  route(path: $path) {
    __typename
    path

    ... on InternalUrl {
      routeName
      ${routeSpreads}
    }

    ... on EntityUrl {
      routeName
      drupalRouteEntity: entity {
        uuid
        entityBundle
        entityTypeId
        id
      }
      ${routeSpreads}
    }

    ... on RedirectUrl {
      redirect {
        statusCode
      }
    }
  }
}
`,
    )

    const routeQueries = Object.entries(options?.routeQueries || {}) as [
      string,
      DrupalRouteDefinition,
    ][]

    if (helper.isModuleBuild) {
      routeQueries.push([
        'nodeCanonical',
        {
          fragments: ['nodePage'],
        },
      ])
    }

    if (routeQueries.length) {
      helper.addComposable('useDrupalRouteQuery')
    }

    const routeQueryBuilder = new RouteQueryBuilder(helper.graphql)

    // Set when nuxt-graphql-middleware has collected the fragments, which is
    // before Nuxt generates the templates.
    const state = {
      graphqlTypes: '',
      // The object types that each fragment of the route queries matches.
      fragmentObjectTypes: {} as Record<string, string[]>,
    }

    const fragmentNames = [
      ...new Set(routeQueries.flatMap((v) => v[1].fragments || [])),
    ]

    helper.addTemplate(
      'route-queries',
      () => () => {
        const mapping: Record<string, string> = {}
        const entityTypes: Record<string, string[] | null> = {}
        for (const [name, definition] of routeQueries) {
          mapping[name] = camelCase('route_' + name)
          const fragments = definition.fragments || []
          entityTypes[name] = fragments.length
            ? [
                ...new Set(
                  fragments.flatMap((v) => state.fragmentObjectTypes[v] || []),
                ),
              ].sort()
            : null
        }
        return `
export const mapping = ${JSON.stringify(mapping, null, 2)}
export const entityTypes = ${JSON.stringify(entityTypes, null, 2)}
`
      },
      () => () => {
        const importStatement = fragmentNames.length
          ? `import type {\n  ${fragmentNames.map((v) => pascalCase(v + 'Fragment')).join(',\n  ')}\n} from '#graphql-operations'`
          : ''

        const toUnion = (typeNames: string[]) =>
          typeNames.map((v) => `'${v}'`).join(' | ')

        const queries = routeQueries
          .map(([name, definition]) => {
            const fragments = definition.fragments || []
            // Without fragments, the query only selects the __typename.
            if (!fragments.length) {
              return `"${name}": { __typename: ${toUnion(routeQueryBuilder.entityObjectTypes)} }`
            }

            // The query selects the __typename, the fragments might not.
            const entity = fragments
              .map((fragmentName) => {
                const typeName = pascalCase(fragmentName + 'Fragment')
                const objectTypes = state.fragmentObjectTypes[fragmentName]
                return objectTypes?.length
                  ? `(${typeName} & { __typename: ${toUnion(objectTypes)} })`
                  : typeName
              })
              .join(' | ')
            return `"${name}": ${entity}`
          })
          .join(',\n    ')

        const possibleQueryNames =
          routeQueries
            .map(([name]) => `'${camelCase('route_' + name)}'`)
            .join(' | ') || 'never'

        return `
${importStatement}
import type { Query } from '#nuxt-graphql-middleware/operation-types'

declare module '#vuepal-build/route-queries' {
  /**
   * The entity of each route query in the drupalRoute.routeQueries option.
   */
  export type DrupalRouteQueries = {
    ${queries}
  }
  type PossibleQueryNames = ${possibleQueryNames}

  /**
   * The name of the GraphQL query of each route query.
   */
  export const mapping: Record<keyof DrupalRouteQueries, keyof Pick<Query, PossibleQueryNames>>;

  /**
   * The object types of the entities that each route query accepts, or null
   * for any type.
   */
  export const entityTypes: Record<keyof DrupalRouteQueries, string[] | null>;
}
`
      },
    )

    helper.addTemplate(
      'graphql',
      () => {
        return 'export {}'
      },
      () => {
        return () => state.graphqlTypes
      },
    )

    let hasBuilt = false
    helper.nuxt.hook('nuxt-graphql-middleware:build', async (ctx) => {
      const fragments = ctx.output.getFragments().map((v) => v.node)
      routeQueryBuilder.handleFragments(fragments)

      const previous = JSON.stringify(state)
      state.graphqlTypes = routeQueryBuilder.buildGraphqlTypesTemplate()
      state.fragmentObjectTypes = {}
      for (const fragmentName of fragmentNames) {
        state.fragmentObjectTypes[fragmentName] =
          routeQueryBuilder.getFragmentObjectTypes(fragmentName)
      }

      // In dev, a changed fragment can change the types of the route queries.
      if (hasBuilt && JSON.stringify(state) !== previous) {
        await updateTemplates({
          filter: (template) =>
            template.filename.startsWith('vuepal-build/route-queries') ||
            template.filename.startsWith('vuepal-build/graphql'),
        })
      }
      hasBuilt = true
    })

    // Generate GraphQL queries.
    routeQueries.forEach(([name, definition]) => {
      const queryName = camelCase('route_' + name)

      const spreads = (definition.fragments || [])
        .map((v) => '...' + v)
        .join('\n        ')
      helper.graphql.addDocument(
        'vuepal-route-query:' + name,
        `
query ${queryName}($path: String!) {
  ...useDrupalRoute
  route(path: $path) {
    ... on EntityUrl {
      entity {
        __typename
        ${spreads}
      }
    }
  }
}`,
      )
    })
  },
})
