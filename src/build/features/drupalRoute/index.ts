import { defineVuepalFeature } from '../defineFeature'

export default defineVuepalFeature({
  name: 'drupalRoute',
  description: 'Adds routing related GraphQL queries and composables.',
  setup(helper) {
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
    const breadcrumbSpread = helper.hasFeatureEnabled('breadcrumb')
      ? 'breadcrumb { ...breadcrumb }'
      : ''

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

fragment metatag on Metatag {
  id
  tag
  attributes {
    key
    value
  }
}
`,
    )
  },
})
