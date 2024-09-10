/**
 * Type check for non-nullable values.
 *
 * Used as the callback for array.filter, e.g.
 * items.filter(nonNullable)
 */
export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
