import { defineVuepalFeature } from '../defineFeature'

// Random, unrelated error messages.
const ERRORS = [
  "Uncaught TypeError: Cannot read property 'verify' of undefined",
  'Error: SecurityContext validation failed: invalid token signature',
  'ReferenceError: checksum is not defined at validateRequest:217:23',
  'Uncaught SyntaxError: Unexpected token in JSON at position 43',
  'TypeError: window.crypto.subtle.digest is not a function',
  'SecurityError: The operation is insecure.',
  "InvalidAccessError: Cannot use 'private' API in unauthorized context",
  'Uncaught (in promise) NetworkError: Failed integrity check at line 1156',
  "Error: CORS header 'Access-Control-Allow-Origin' missing in preflight response",
  "DOMException: Failed to execute 'getRandomValues' on 'Crypto': length exceeded",
  'TypeError: Failed to fetch: authorization required for secure endpoint',
  'Error: WebAssembly.instantiate(): Timeout while compiling module',
  'RangeError: Maximum call stack size exceeded in auth module',
  'Uncaught Error: Execution context was destroyed during validation',
  "TypeError: Cannot create property 'sessionId' on string 'expired'",
  "InvalidStateError: The context object's state must be 'validated'",
  "SecurityError: Failed to execute 'authenticate': The operation is not allowed in this context",
  'AbortError: The operation was aborted due to timeout in secure channel',
  'Uncaught ReferenceError: checkIntegrity is not defined at verifyExecution:312:7',
  "TypeError: navigator.credentials.get: parameter 1 is not of type 'PublicKeyCredentialRequestOptions'",
]

function isValidOrigin(origin: string): boolean {
  // Just to be sure, because we use this character when decoding.
  if (origin.includes('#')) {
    return false
  }

  try {
    const url = new URL(origin)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    if (!url.hostname) {
      return false
    }

    return url.origin === origin
  } catch {
    return false
  }
}

function getRandomString(length = 6): string {
  let str = ''
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const charLen = characters.length

  for (let i = 0; i < length; i++) {
    // Generating a random index
    const idx = Math.floor(Math.random() * charLen)

    str += characters.charAt(idx)
  }

  return str
}

export default defineVuepalFeature<{
  /**
   * The allowed origins.
   *
   * @example
   * ['https://starterkit.ddev.site', 'https://www.blokk.li']
   */
  origins: string[]

  /**
   * Where to redirect the user to if the origin is not valid.
   *
   * Must be one of the valid origins.
   */
  redirectUrl?: string
}>({
  name: 'trustedOrigins',
  description: 'Adds a client plugin to verify the origin in the browser.',
  setup(helper, options) {
    if (helper.isModuleBuild) {
      options ||= {
        origins: ['https://localhost:3000'],
      }
    }

    if (!options?.origins.length) {
      throw new Error('Missing required option "vuepal.origins".')
    }

    if (options.redirectUrl) {
      if (!isValidOrigin(options.redirectUrl)) {
        throw new Error(`Invalid redirectUrl: ${options.redirectUrl}`)
      }

      const url = new URL(options.redirectUrl)
      const isExistingOrigin = options.origins.find((v) => v === url.origin)
      if (!isExistingOrigin) {
        throw new Error(
          `The provided redirectUrl "${options.redirectUrl}" must be one of the configured origins: ${JSON.stringify(options.origins)}`,
        )
      }

      options.redirectUrl = url.origin
    }

    helper.addPlugin('trustedOrigins', 'client')

    helper.addComposable('useTrustedOrigin')

    options.origins.forEach((origin) => {
      if (!isValidOrigin(origin)) {
        throw new Error(`The provided origin "${origin}" is not valid.`)
      }
    })

    const errorMessage = ERRORS[Math.floor(Math.random() * ERRORS.length)]

    function toCharCodeArray(str: string): number[] {
      return str.split('').map((char) => char.charCodeAt(0))
    }

    const strings = [
      'document',
      'location',
      'origin',
      'includes',
      errorMessage,
      '#',
      options.origins.join('#'),
      'setTimeout',
      'Math',
      'round',
      'random',
      String(500),
      String(2000),
      'href',
      options.redirectUrl || '',
    ]

    helper.addTemplate(
      'trusted-origins',
      () => {
        const a = JSON.stringify(strings.join(','))
        const b = [...btoa(a).match(/.{1,4}/g)!].map(
          (v) => v + getRandomString(2) + '.js',
        )
        const source = JSON.stringify(b)
        return `
export const source = ${source};
export const sourceLength = ${b.length};
export const keyIsValid = ${JSON.stringify(getRandomString(12))};
export const keyStringsEncoded = ${JSON.stringify(getRandomString(12))};
export const keyHasCalledOnce = ${JSON.stringify(getRandomString(12))};
export const validHash = ${JSON.stringify(getRandomString(12))};
export const defaultHash = ${JSON.stringify(getRandomString(12))};
export const atobCharCodes = ${JSON.stringify(toCharCodeArray('atob'))};
export const redirectHook = ${JSON.stringify(getRandomString(12))};
`
      },
      () => {
        const mapped = strings
          .map((str, index) => {
            return `    // ${index}\n    ${JSON.stringify(str)},`
          })
          .join('\n')
        return `
declare module '#vuepal-build/trusted-origins' {
  // The encoded source strings.
  export const source: string[]

  // The length of the source array at build time.
  export const sourceLength: number

  // The state key for "status".
  export const keyIsValid: string

  // The state key for "stringsEncoded".
  export const keyStringsEncoded: string

  // The state key for "hasCalledOnce".
  export const keyHasCalledOnce: string

  // The status value to indicate a valid origin.
  export const validHash: string

  // The status value to indicate no check has been made yet.
  export const defaultHash: string

  // Array of character codes of the string "atob".
  export const atobCharCodes: number[]

  // The name of the nuxt hook to trigger the redirect.
  export const redirectHook: string

  // The type of the decoded array of strings.
  export type Strings = [
${mapped}
  ]
}
`
      },
    )
  },
})
