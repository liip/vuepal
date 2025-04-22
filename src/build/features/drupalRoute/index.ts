import { defineVuepalFeature } from '../defineFeature'
import { pascalCase, camelCase } from 'change-case'

type DrupalRouteDefinition = {
  /**
   * Which fragments to include for the route query.
   *
   * The fragments must exist in the project and they must target a type
   * that implements "Entity".
   */
  fragments: string[]
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

    // Conditionally add the breadcrumb on the route fragment.
    const breadcrumbSpread = helper.hasFeatureEnabled('breadcrumb')
      ? 'breadcrumb { ...breadcrumb }'
      : ''

    // Conditionally add the languageSwitchLinks on the route fragment.
    const languageSwitchLinksSpread = helper.hasFeatureEnabled(
      'languageSwitchLinks',
    )
      ? 'languageSwitchLinks { ...languageSwitchLink }'
      : ''

    helper.graphql.addDocument(
      'fragment.drupalRoute.graphql',
      `
fragment useDrupalRoute on Query {
  route(path: $path) {
    __typename
    path

    ... on InternalUrl {
      ${breadcrumbSpread}
      ${languageSwitchLinksSpread}

      metatags {
        ...metatag
      }

      routeName
    }

    ... on EntityUrl {
      ${breadcrumbSpread}
      ${languageSwitchLinksSpread}

      metatags {
        ...metatag
      }

      drupalRouteEntity: entity {
        uuid
        entityBundle
        entityTypeId
        id
      }

      routeName
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

    const routeQueries = Object.entries(options?.routeQueries || {})

    if (helper.isModuleBuild) {
      routeQueries.push([
        'nodeCanonical',
        {
          fragments: ['nodePage'],
        },
      ])
    }

    if (!routeQueries.length) {
      return
    }

    helper.addComposable('useDrupalRouteQuery')

    helper.addTemplate(
      'route-queries',
      () => {
        const mapping = routeQueries.reduce<Record<string, string>>(
          (acc, [name]) => {
            acc[name] = camelCase('route_' + name)
            return acc
          },
          {},
        )
        return `
export const mapping = ${JSON.stringify(mapping, null, 2)}
`
      },
      () => {
        const imports = [
          ...new Set(routeQueries.flatMap((v) => v[1].fragments)).values(),
        ]
          .map((fragmentName) => {
            return pascalCase(fragmentName + 'Fragment')
          })
          .join(',\n  ')
        const importStatement = `import type {\n  ${imports}\n} from '#graphql-operations'`
        const queries = routeQueries
          .map(([name, definition]) => {
            const fragments = definition.fragments
              .map((v) => pascalCase(v + 'Fragment'))
              .join(' | ')
            return `"${name}": ${fragments}`
          })
          .join(',\n  ')

        const possibleQueryNames = routeQueries
          .map(([name]) => {
            return `'${camelCase('route_' + name)}'`
          })
          .join(' | ')

        return `
${importStatement}
import type { Query } from '#nuxt-graphql-middleware/operation-types'

declare module '#vuepal-build/route-queries' {
  export type DrupalRouteQueries = {
    ${queries}
  }
  type PossibleQueryNames = ${possibleQueryNames}
  export const mapping: Record<keyof DrupalRouteQueries, keyof Pick<Query, PossibleQueryNames>>;
}
`
      },
    )

    // Generate GraphQL queries.
    routeQueries.forEach(([name, definition]) => {
      const queryName = camelCase('route_' + name)

      const spreads = definition.fragments
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
