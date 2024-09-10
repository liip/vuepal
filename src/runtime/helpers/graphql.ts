/**
 * This takes in an object, removes the __typename property, takes its
 * remaining keys and checks if it extends "never". An empty object has the
 * never type, therefore we return false to indicate that it has no additional
 * properties.
 */
type HasAdditionalProperties<T> = keyof Omit<T, '__typename'> extends never
  ? false
  : true

/**
 * Infer the allowed typenames.
 *
 * This is used only for DX. When filtering an array of GraphQL objects by a
 * type, we only want to allow types that actually have more fields than just
 * __typename.
 *
 * Assume the following array:
 * [
 *   {
 *     __typename: 'NodePressRelease',
 *   },
 *  {
 *     __typename: 'NodePressRelease',
 *   },
 *  {
 *     __typename: 'NodePage',
 *     title: 'Hello world',
 *   },
 * ]
 *
 * It's unlikely that anyone would want to filter for "NodePressRelease" in
 * this case, so we filter out all the objects that only have one property
 * (__typename).
 *
 * In this example, the result will be:
 * T = 'NodePage'
 */
type InferAllowedTypenames<T extends { __typename: string }> = {
  [K in T['__typename']]: HasAdditionalProperties<
    Extract<T, { __typename: K }>
  > extends true
    ? K
    : never
}[T['__typename']]

/**
 * Check if the object is of the given GraphQL type.
 */
export function isTypeName<T extends { __typename: string }>(
  item: T,
  typename: T['__typename'],
): item is T {
  return item && item.__typename === typename
}

/**
 * Filter an array of GraphQL objects by one or more types.
 *
 * Some queries like entityQuery return items as Entity interface, even if the
 * query conditions only ever return Node for example. This method filters the
 * array to only include the desired types and narrows down the proper fragment
 * type.
 */
export function filterByTypenames<
  T extends { __typename: string },
  K extends InferAllowedTypenames<T>,
>(
  items: Array<T> = [],
  typenames: Array<K> | K,
): Array<Extract<T, { __typename: K }>> {
  return items.filter((item) =>
    typeof typenames === 'string'
      ? isTypeName(item, typenames)
      : typenames.some((typename) => isTypeName(item, typename)),
  ) as Array<Extract<T, { __typename: K }>>
}

/**
 * Remove the __typename property from a GraphQL object.
 */
export function removeTypename<T extends { __typename?: string }>(
  v: T,
): Omit<T, '__typename'> {
  const clone = { ...v }
  delete clone.__typename
  return clone
}

/**
 * Narrow a GraphQL type by property.
 *
 * The input object can be one or more typical GraphQL fragment types.
 * The second argument is the name of property that should be checked.
 *
 * The returned type is narrowed using the given property.
 */
export function narrowTypeByProperty<T extends {}, K extends keyof T>(
  obj: T | {} | null | undefined,
  propName: K,
): T | undefined {
  if (obj && propName in obj) {
    return obj as T
  }
  return undefined
}
