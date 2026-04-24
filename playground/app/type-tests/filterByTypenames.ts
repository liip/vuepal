/**
 * Type-level tests for filterByTypenames.
 *
 * Tests various entityQuery result shapes to ensure types are correctly
 * inferred without explicit type parameters.
 */
import { filterByTypenames } from '#vuepal/helpers/graphql'
import type {
  EntityQueryAllFragmentsQuery,
  EntityQuerySingleFragmentNoTypenameQuery,
  EntityQuerySingleFragmentWithTypenameQuery,
  EntityQueryInlineOnlyQuery,
  EntityQueryMixedTypenameQuery,
  EntityQueryTypenameInlineWithFragmentQuery,
  NodePageFragment,
  NodePressReleaseFragment,
  NodeContactFragment,
} from '#graphql-operations'
import { expectType } from './helpers'
import type { IsExact } from './helpers'

// All fragments + __typename via inline on Node.
declare const allFragments: EntityQueryAllFragmentsQuery
const allItems = allFragments.entityQuery.items

const _pressReleases = filterByTypenames(allItems, 'NodePressRelease')
expectType<IsExact<typeof _pressReleases, NodePressReleaseFragment[]>>()

const _multiple = filterByTypenames(allItems, [
  'NodePressRelease',
  'NodeContact',
])
expectType<
  IsExact<typeof _multiple, (NodePressReleaseFragment | NodeContactFragment)[]>
>()

const _fromUndefined = filterByTypenames(
  undefined as typeof allItems,
  'NodePage',
)
expectType<
  IsExact<
    typeof _fromUndefined,
    (NodePageFragment & { __typename: 'NodePage' })[]
  >
>()

const _fromNull = filterByTypenames(null as typeof allItems | null, 'NodePage')
expectType<
  IsExact<typeof _fromNull, (NodePageFragment & { __typename: 'NodePage' })[]>
>()

// Fragment without __typename: filtering is correctly rejected since there's
// no __typename to match against.
declare const noTypename: EntityQuerySingleFragmentNoTypenameQuery
// @ts-expect-error — no fragment has __typename
filterByTypenames(noTypename.entityQuery.items, 'NodePage')

// Fragment with __typename.
declare const withTypename: EntityQuerySingleFragmentWithTypenameQuery
const _withTypenameItems = filterByTypenames(
  withTypename.entityQuery.items,
  'NodeContact',
)
expectType<IsExact<typeof _withTypenameItems, NodeContactFragment[]>>()

// Inline fragments only, no named fragments.
declare const inlineOnly: EntityQueryInlineOnlyQuery

const _inlinePage = filterByTypenames(inlineOnly.entityQuery.items, 'NodePage')
expectType<
  IsExact<typeof _inlinePage, { __typename: 'NodePage'; title?: string }[]>
>()

const _inlineContact = filterByTypenames(
  inlineOnly.entityQuery.items,
  'NodeContact',
)
expectType<
  IsExact<typeof _inlineContact, { __typename: 'NodeContact'; uuid: string }[]>
>()

// Mixed: fragment without __typename + fragment with __typename.
// Only NodePressReleaseFragment has __typename, so only it is filterable.
declare const mixed: EntityQueryMixedTypenameQuery
const _mixedPress = filterByTypenames(
  mixed.entityQuery.items,
  'NodePressRelease',
)
expectType<IsExact<typeof _mixedPress, NodePressReleaseFragment[]>>()

// __typename added via inline on Node + fragment without __typename.
declare const inlineWithFragment: EntityQueryTypenameInlineWithFragmentQuery
const _inlineWithPage = filterByTypenames(
  inlineWithFragment.entityQuery.items,
  'NodePage',
)
expectType<
  IsExact<
    typeof _inlineWithPage,
    (NodePageFragment & { __typename: 'NodePage' })[]
  >
>()
