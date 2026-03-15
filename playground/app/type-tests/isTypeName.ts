/**
 * Type-level tests for isTypeName.
 */

import { isTypeName } from '#vuepal/helpers/graphql'
import type {
  EntityQueryAllFragmentsQuery,
  EntityQueryInlineOnlyQuery,
  EntityQuerySingleFragmentWithTypenameQuery,
  NodePageFragment,
  NodeContactFragment,
} from '#graphql-operations'
import { expectType } from './helpers'
import type { IsExact } from './helpers'

// Narrowing from a union with all fragments.
declare const _allFragments: EntityQueryAllFragmentsQuery
type AllItem = NonNullable<
  NonNullable<typeof _allFragments.entityQuery.items>[number]
>
declare const allItem: AllItem

if (
  isTypeName<NodePageFragment & { __typename: 'NodePage' }>(allItem, 'NodePage')
) {
  expectType<
    IsExact<typeof allItem, NodePageFragment & { __typename: 'NodePage' }>
  >()
}

// Accepts null/undefined.
isTypeName<NodeContactFragment>(null, 'NodeContact')
isTypeName<NodeContactFragment>(undefined, 'NodeContact')

// Narrowing from inline fragments.
declare const _inlineOnly: EntityQueryInlineOnlyQuery
type InlineItem = NonNullable<
  NonNullable<typeof _inlineOnly.entityQuery.items>[number]
>
declare const inlineItem: InlineItem

if (
  isTypeName<{ __typename: 'NodePage'; title?: string }>(inlineItem, 'NodePage')
) {
  expectType<
    IsExact<typeof inlineItem, { __typename: 'NodePage'; title?: string }>
  >()
}

// Narrowing from a single fragment with __typename.
declare const _withTypename: EntityQuerySingleFragmentWithTypenameQuery
type WithTypenameItem = NonNullable<
  NonNullable<typeof _withTypename.entityQuery.items>[number]
>
declare const withTypenameItem: WithTypenameItem

if (isTypeName<NodeContactFragment>(withTypenameItem, 'NodeContact')) {
  expectType<IsExact<typeof withTypenameItem, NodeContactFragment>>()
}
