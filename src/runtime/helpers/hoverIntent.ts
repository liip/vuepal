import type { InjectionKey } from 'vue'

type Point = { x: number; y: number }
type Sample = Point & { t: number }

/**
 * How long pointer positions are kept, in milliseconds.
 */
const HISTORY = 200

/**
 * The direction of the pointer is measured over this time, in milliseconds.
 * A shorter movement than MIN_DISTANCE pixels has no direction.
 */
const DIRECTION_WINDOW = 50
const MIN_DISTANCE = 4

/**
 * The pointer rests when it moved less than SENSITIVITY pixels in REST_WINDOW
 * milliseconds. These are the defaults of the jQuery hoverIntent plugin that
 * Drupal's admin_toolbar uses.
 */
const REST_WINDOW = 100
const SENSITIVITY = 6

/**
 * A pointer that moves within this angle of vertical, in degrees, aims at the
 * link of the top-level bar it enters.
 */
const AIM_ANGLE = 45

/**
 * A pointer heads into an open submenu when it moves within this angle of
 * straight towards it, in degrees, on a line that crosses the submenu or
 * passes it by less than TOLERANCE pixels.
 */
const HEADING_ANGLE = 70
const TOLERANCE = 20

/**
 * A link that doesn't open right away opens once the pointer stops on it for
 * this time, in milliseconds. It is longer when the pointer heads into the
 * submenu of another link, so that a short pause on the way doesn't close it.
 */
const STOP_DELAY = 100
const HEADING_STOP_DELAY = 300

const AIM_TAN = Math.tan((AIM_ANGLE * Math.PI) / 180)
const HEADING_COS = Math.cos((HEADING_ANGLE * Math.PI) / 180)

export type PointerHistory = {
  start: () => void
  stop: () => void
  /**
   * The position of the pointer at time `t`, if it is still known.
   */
  positionAt: (t: number) => Sample | undefined
  /**
   * The oldest known position of the pointer.
   */
  oldest: () => Sample | undefined
}

export const POINTER_HISTORY: InjectionKey<PointerHistory> = Symbol(
  'vuepal-pointer-history',
)

/**
 * Record the recent positions of the pointer on the whole page.
 *
 * Whether the pointer moved up into the toolbar is only known from where it
 * was before it entered the toolbar.
 */
export function createPointerHistory(): PointerHistory {
  const samples: Sample[] = []

  function indexAt(t: number): number {
    for (let i = samples.length - 1; i >= 0; i--) {
      if (samples[i]!.t <= t) {
        return i
      }
    }
    return -1
  }

  function onMouseMove(e: MouseEvent) {
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
    // Keep the last position older than HISTORY: there a pointer rests.
    const index = indexAt(e.timeStamp - HISTORY)
    if (index > 0) {
      samples.splice(0, index)
    }
  }

  function onMouseOut(e: MouseEvent) {
    // Where the pointer left the window says nothing about where it comes
    // back.
    if (!e.relatedTarget) {
      samples.length = 0
    }
  }

  return {
    start() {
      // Capture, so that the handlers of the links see the current position.
      document.addEventListener('mousemove', onMouseMove, {
        capture: true,
        passive: true,
      })
      document.addEventListener('mouseout', onMouseOut, { passive: true })
    },
    stop() {
      document.removeEventListener('mousemove', onMouseMove, { capture: true })
      document.removeEventListener('mouseout', onMouseOut)
      samples.length = 0
    },
    positionAt: (t) => samples[indexAt(t)],
    oldest: () => samples[0],
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Whether the pointer, moving from `from` in the direction `d`, heads into
 * the submenu.
 */
function isHeadingInto(from: Point, d: Point, submenu: DOMRect): boolean {
  // Straight towards the submenu is towards its point closest to the pointer.
  const closest = {
    x: Math.min(Math.max(from.x, submenu.left), submenu.right),
    y: Math.min(Math.max(from.y, submenu.top), submenu.bottom),
  }
  const towards = { x: closest.x - from.x, y: closest.y - from.y }
  const towardsLength = Math.hypot(towards.x, towards.y)
  if (towardsLength === 0) {
    // The pointer comes from the submenu.
    return false
  }
  const cos =
    (d.x * towards.x + d.y * towards.y) / (Math.hypot(d.x, d.y) * towardsLength)
  if (cos < HEADING_COS) {
    return false
  }

  // Whether the line crosses the submenu, enlarged by TOLERANCE on each side
  // (slab method).
  let tMin = 0
  let tMax = Infinity
  const axes = [
    [from.x, d.x, submenu.left - TOLERANCE, submenu.right + TOLERANCE],
    [from.y, d.y, submenu.top - TOLERANCE, submenu.bottom + TOLERANCE],
  ] as const
  for (const [origin, delta, min, max] of axes) {
    if (delta === 0) {
      if (origin < min || origin > max) {
        return false
      }
    } else {
      const t1 = (min - origin) / delta
      const t2 = (max - origin) / delta
      tMin = Math.max(tMin, Math.min(t1, t2))
      tMax = Math.min(tMax, Math.max(t1, t2))
    }
  }
  return tMin <= tMax
}

/**
 * Decide when to open a link the pointer is on: 0 to open it now, or the time
 * the pointer has to stop on it first.
 */
function getOpenDelay(options: {
  /** The position of the pointer. */
  to: Point
  /** Its position DIRECTION_WINDOW ago. */
  from: Point | null
  /** Its position REST_WINDOW ago. */
  restFrom: Point | null
  /** Whether the link is in the top-level bar. */
  topLevel: boolean
  /** The open submenu of another link in the same list. */
  openSubmenu: DOMRect | null
}): number {
  const { to, from, restFrom, topLevel, openSubmenu } = options
  const d =
    from && distance(from, to) >= MIN_DISTANCE
      ? { x: to.x - from.x, y: to.y - from.y }
      : null

  // On its way into the open submenu of another link, the pointer crosses
  // this link.
  if (openSubmenu && from && d && isHeadingInto(from, d, openSubmenu)) {
    return HEADING_STOP_DELAY
  }

  // The submenus are in use: the list is a submenu itself, or a link in the
  // top-level bar has its submenu open.
  if (!topLevel || openSubmenu) {
    return 0
  }

  // Moving up into the top-level bar, or down onto it, aims at the link.
  if (d && Math.abs(d.x) <= Math.abs(d.y) * AIM_TAN) {
    return 0
  }

  if (restFrom && distance(restFrom, to) < SENSITIVITY) {
    return 0
  }

  // Probably passing over the link.
  return STOP_DELAY
}

export type HoverIntentOptions = {
  history: PointerHistory | null
  /** Whether the link is in the top-level bar. */
  isTopLevel: () => boolean
  /** Whether the link is the active one of its list. */
  isActive: () => boolean
  /** The open submenu of another link in the same list. */
  getOpenSubmenu: () => Element | null
  /** Makes the link the active one of its list. */
  onIntent: () => void
}

export type HoverIntent = {
  /** For mouseenter and mousemove on the link. */
  onPointer: (e: MouseEvent) => void
  /** For mouseleave on the link. */
  cancel: () => void
}

/**
 * Open the submenu of a link as soon as the movement of the pointer shows
 * that it's meant for this link, and not when the pointer only passes over
 * it.
 *
 * Opens right away when:
 * - a submenu is in use: the link is in a submenu, or another link of the
 *   top-level bar has its submenu open,
 * - the pointer moves up into the top-level bar, or down onto it,
 * - the pointer rests (the check of Drupal's admin_toolbar).
 *
 * Otherwise it opens once the pointer stops on the link. That includes a
 * pointer that crosses the link on its way into the open submenu of another
 * link (like the "safe triangle" of other menus), which would otherwise close
 * that submenu.
 */
export function createHoverIntent(options: HoverIntentOptions): HoverIntent {
  let timeout: number | null = null

  function cancel() {
    if (timeout !== null) {
      window.clearTimeout(timeout)
      timeout = null
    }
  }

  function onPointer(e: MouseEvent) {
    cancel()
    if (options.isActive()) {
      return
    }
    const history = options.history
    const delay = getOpenDelay({
      to: { x: e.clientX, y: e.clientY },
      from:
        history?.positionAt(e.timeStamp - DIRECTION_WINDOW) ??
        history?.oldest() ??
        null,
      restFrom: history?.positionAt(e.timeStamp - REST_WINDOW) ?? null,
      topLevel: options.isTopLevel(),
      openSubmenu: options.getOpenSubmenu()?.getBoundingClientRect() ?? null,
    })
    if (delay === 0) {
      options.onIntent()
    } else {
      timeout = window.setTimeout(() => {
        timeout = null
        options.onIntent()
      }, delay)
    }
  }

  return { onPointer, cancel }
}
