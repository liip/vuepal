/**
 * Type-level tests for narrowTypeByProperty.
 */

import { narrowTypeByProperty } from '#vuepal/helpers/graphql'
import type { NodePageFragment, NodeContactFragment } from '#graphql-operations'
import { expectType } from './helpers'
import type { IsExact } from './helpers'

// Narrows to the union member that has the property.
type PageOrContact =
  | (NodePageFragment & { __typename: 'NodePage' })
  | NodeContactFragment

declare const entity: PageOrContact

const _contact = narrowTypeByProperty(entity, 'uuid')
expectType<IsExact<typeof _contact, NodeContactFragment | undefined>>()

// Accepts null/undefined.
narrowTypeByProperty(null as PageOrContact | null, 'uuid')
narrowTypeByProperty(undefined as PageOrContact | undefined, 'uuid')
