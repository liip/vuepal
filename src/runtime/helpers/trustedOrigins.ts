import { atobCharCodes, type Strings } from '#vuepal-build/trusted-origins'

// Contains the window on client side.
export const globalWindow: typeof global | null = import.meta.client
  ? Function('return this')()
  : null

let decodedStrings: Strings | null = null

export function getStrings(
  stringsEncoded: string[] | null,
  cb: (strings: Strings) => void,
): void {
  if (import.meta.server) {
    return
  }
  if (decodedStrings) {
    return cb(decodedStrings)
  }

  if (!stringsEncoded) {
    throw new Error()
  }

  if (!globalWindow) {
    throw new Error()
  }

  // Will contain a base64 encoded string.
  let result = ''

  for (let i = 0; i < stringsEncoded.length; i++) {
    // The array contains a list of strings that look like file names.
    // We are only interested in the first 4 characters.
    result += stringsEncoded[i]!.slice(0, 4)
  }

  // A valid JSON encoded string.
  const atobMethod = String.fromCharCode(...atobCharCodes) as 'atob'
  const decoded = globalWindow[atobMethod](result)

  // The actual string, containing our properties, separated by comma.
  const parsed = JSON.parse(decoded) as string

  // Calls the "split" method on the string.
  // This will return our final array of strings.
  decodedStrings = parsed.split(',') as Strings
  cb(decodedStrings)
}
