/**
 * Type-level tests for the route query types and the vuepal:drupal-route hook.
 */
import type { RuntimeNuxtHooks } from '#app'
import type { DrupalRouteQueries } from '#vuepal-build/route-queries'
import type {
  Entity,
  NodeArticleFragment,
  NodePageFragment,
  UseDrupalRouteFragment,
} from '#graphql-operations'
import { expectType } from './helpers'
import type { IsExact } from './helpers'

// The entity of a route query has the __typename of its fragment's type, also
// when the fragment does not select it.
declare const entity: DrupalRouteQueries['nodeCanonical']
if (entity.__typename === 'NodePage') {
  expectType<
    IsExact<typeof entity, NodePageFragment & { __typename: 'NodePage' }>
  >()
}

// A route query without fragments has an entity of any type.
expectType<IsExact<DrupalRouteQueries['routeOnly'], { __typename: Entity }>>()

type Payload = Parameters<RuntimeNuxtHooks['vuepal:drupal-route']>[0]
declare const payload: Payload

// The query name narrows the entity.
if (payload.queryName === 'nodeCanonical') {
  expectType<
    IsExact<
      typeof payload.entity,
      DrupalRouteQueries['nodeCanonical'] | undefined
    >
  >()
}

// useDrupalRoute() passes no query name and no entity.
if (payload.queryName === undefined) {
  expectType<IsExact<typeof payload.entity, undefined>>()
}

// A field narrows the entity to the fragments that select it.
if (payload.entity && 'lead' in payload.entity) {
  expectType<
    IsExact<
      typeof payload.entity,
      NodeArticleFragment & { __typename: 'NodeArticle' }
    >
  >()
}

// The routeGlobal fragment of the queryFragments option is part of the
// useDrupalRoute fragment.
expectType<
  IsExact<NonNullable<Payload['routeQuery']>, UseDrupalRouteFragment>
>()
const _messages: UseDrupalRouteFragment['messengerMessages'] = []
void _messages
