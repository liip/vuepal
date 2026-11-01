/**
 * Type-level tests for narrowTypeByProperty.
 */

import { narrowTypeByProperty } from '#vuepal/helpers/graphql'
import type { NodePageFragment, NodeArticleFragment } from '#graphql-operations'
import { expectType } from './helpers'
import type { IsExact } from './helpers'

// Narrows to the union member that has the property.
type PageOrArticle =
  | (NodePageFragment & { __typename: 'NodePage' })
  | NodeArticleFragment

declare const entity: PageOrArticle

const _article = narrowTypeByProperty(entity, 'uuid')
expectType<IsExact<typeof _article, NodeArticleFragment | undefined>>()

// Accepts null/undefined.
narrowTypeByProperty(null as PageOrArticle | null, 'uuid')
narrowTypeByProperty(undefined as PageOrArticle | undefined, 'uuid')
