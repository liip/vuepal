export type ArrayGroup<T> = {
  key: string
  items: T[]
}

/**
 * Group an array of items by a property.
 *
 * If an item can't be grouped it is discarded.
 */
export function groupByProperty<T extends {}>(
  items: T[],
  property: keyof T,
): ArrayGroup<T>[] {
  return Object.values(
    items.reduce<Record<string, ArrayGroup<T>>>((acc, item) => {
      if (!item) {
        return acc
      }
      const key = item[property]
      if (typeof key === 'string') {
        if (!acc[key]) {
          acc[key] = {
            key,
            items: [],
          }
        }
        acc[key].items.push(item)
      }
      return acc
    }, {}),
  )
}

/**
 * Remove duplicates from an array.
 */
export function onlyUnique<T>(value: T, index: number, self: Array<T>) {
  return self.indexOf(value) === index
}
