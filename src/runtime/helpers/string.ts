/**
 * Determine if a string renders something meaningful.
 *
 * We define meaningful as such that it must contain at least one character
 * from a to z, in either lower or upper case. This is mainly to filter out
 * strings that are not empty, but only contain spaces or newlines.
 */
export function stringShouldRender(v?: string | null | undefined): boolean {
  return !!v && /[a-z\d]/i.test(v)
}
