import {
  keyIsValid,
  keyStringsEncoded,
  keyHasCalledOnce,
  validHash,
  defaultHash,
  redirectHook,
  type Strings,
} from '#vuepal-build/trusted-origins'
import {
  useState,
  computed,
  type ComputedRef,
  type Ref,
  watch,
  useNuxtApp,
} from '#imports'
import { globalWindow, getStrings } from './../../helpers/trustedOrigins'

type UseTrustedOriginOptions = {
  /**
   * Whether to redirect the user to the configured location.
   */
  redirect?: boolean
}

/**
 * Checks whether the current browser origin is trusted.
 *
 * The check is only performed once, even when the composable is called multiple times.
 * The check is executed after a random delay.
 *
 * The returned value is reactive and will change after the delay. It contains
 * a (random) error message if the current origin is not valid.
 *
 * If the origin is valid, the value is null.
 *
 * Keep in mind that this is not meant to be impossible to circumvent - it
 * should just make it a bit harder to "proxy" a website under an invalid
 * domain. If somebody truly wanted, they will be able to bypass the check by
 * modifying the actual script. It's just more effort.
 */
export function useTrustedOrigin(
  options?: UseTrustedOriginOptions,
): ComputedRef<string | null> {
  // No check on server side.
  if (import.meta.server) {
    return computed(() => null)
  }

  const app = useNuxtApp()

  // By default assume the origin to be valid.
  const status = useState<string>(keyIsValid, () => defaultHash)

  // Provided by the plugin.
  const stringsEncoded = useState<string[] | null>(
    keyStringsEncoded,
    () => null,
  )

  // Make sure we add the setTimeout only once.
  const hasCalledOnce = useState<boolean>(keyHasCalledOnce, () => false)

  function validate(stateVar: Ref<string>, strings: Strings) {
    const _document = strings[0]
    const _location = strings[1]
    const _origin = strings[2]
    const _includes = strings[3]
    const errorMessage = strings[4]
    const separator = strings[5]
    const origins = strings[6].split(separator)

    let tmp = ''

    function checkOrigin() {
      if (globalWindow) {
        tmp = origins[_includes](globalWindow[_document][_location][_origin])
          ? validHash
          : errorMessage
      }
    }

    checkOrigin()

    // Update the state.
    stateVar.value = tmp
  }

  // First time calling the composable.
  if (!hasCalledOnce.value) {
    hasCalledOnce.value = true
    if (globalWindow) {
      getStrings(stringsEncoded.value, (strings) => {
        const _setTimeout = strings[7]
        const _Math = strings[8]
        const _round = strings[9]
        const _random = strings[10]
        const m = globalWindow![_Math]
        const delayBase = parseInt(strings[11])
        const delayMax = parseInt(strings[12])
        const delay = delayBase + m[_round](m[_random]() * delayMax)

        // Use a delay before setting the value.
        globalWindow![_setTimeout](() => {
          validate(status, strings)
        }, delay)
      })
    } else {
      status.value = 'Error'
    }
  }

  // Assume to be valid by default (using defaultHash), before the delayed check
  // or when the check set it to validHash.
  const result = computed(() =>
    status.value === validHash || status.value === defaultHash
      ? null
      : status.value,
  )

  const redirect = options?.redirect
  if (redirect) {
    watch(
      result,
      () => {
        if (result.value === null) {
          return
        }

        // @ts-expect-error Untyped on purpose.
        app.hooks.callHook(redirectHook)
      },
      {
        immediate: true,
      },
    )
  }

  return result
}
