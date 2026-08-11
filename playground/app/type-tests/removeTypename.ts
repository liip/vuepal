/**
 * Type-level tests for removeTypename.
 */

import { removeTypename } from '#vuepal/helpers/graphql'
import type { NodePressReleaseFragment } from '#graphql-operations'

declare const pressRelease: NodePressReleaseFragment
const withoutTypename = removeTypename(pressRelease)

// Existing fields are preserved.
const _title: typeof withoutTypename.title = undefined
void _title
const _uuid: typeof withoutTypename.uuid = ''
void _uuid

// @ts-expect-error — __typename is removed
void withoutTypename.__typename
