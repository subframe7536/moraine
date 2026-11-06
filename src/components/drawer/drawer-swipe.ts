import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup } from 'solid-js'

import {
  attachEventListenerMap,
  createEventListener,
  createEventListenerMap,
} from '../../shared/event-listener'
import { containsOverlayContentAbove } from '../shared/overlay/overlay-stack'

import type { ResolvedDrawerSnapPoint } from './drawer-snap-points'
import {
  clampSnapValue,
  closestSnapPointIndex,
  resolveSnapPointValue,
  snapPointHeightCss,
  resolveSnapPoints,
} from './drawer-snap-points'
import type { DrawerT } from './drawer.types'

export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right'

const AXIS_LOCK_SLOP = 6
const MIN_SWIPE_THRESHOLD = 10
const REVERSE_CANCEL_THRESHOLD = 10
const FAST_SWIPE_VELOCITY = 0.5
const SNAP_VELOCITY_THRESHOLD = 0.5
const SNAP_VELOCITY_MULTIPLIER = 300
const MAX_SNAP_VELOCITY = 4
const MIN_VELOCITY_DURATION_MS = 50
const MIN_VELOCITY_SAMPLE_DISTANCE = 1
const MIN_RELEASE_VELOCITY_DURATION_MS = 4
const MAX_RELEASE_VELOCITY_AGE_MS = 80

const SWIPE_IGNORE_SELECTOR =
  'button, a, input, textarea, select, label, [contenteditable], [role="button"], [role="slider"], [data-swipe-ignore]'
const SWIPE_BODY_SELECTOR = '[data-slot="drawer-body"]'

export function swipeDirectionForSide(
  side: 'top' | 'right' | 'bottom' | 'left',
): DrawerSwipeDirection {
  return side === 'bottom' ? 'down' : side === 'top' ? 'up' : side
}

function isVertical(direction: DrawerSwipeDirection): boolean {
  return direction === 'down' || direction === 'up'
}

/** Sign that maps dismiss-direction displacement onto screen coordinates (+down/+right). */
function screenSign(direction: DrawerSwipeDirection): 1 | -1 {
  return direction === 'down' || direction === 'right' ? 1 : -1
}

/** Past the open edge the popup rubber-bands: extra distance falls off with `sqrt`. */
function dampen(delta: number): number {
  return -Math.sqrt(-delta)
}

function findScrollableAncestor(
  target: EventTarget | null,
  boundary: HTMLElement,
  vertical: boolean,
): HTMLElement | null {
  let node = target instanceof Element ? target : null
  while (node && node !== boundary) {
    if (node instanceof HTMLElement) {
      const style = node.ownerDocument.defaultView?.getComputedStyle(node)
      const overflow = vertical ? style?.overflowY : style?.overflowX
      const canOverflow = overflow === 'auto' || overflow === 'scroll'
      const hasOverflow = vertical
        ? node.scrollHeight > node.clientHeight
        : node.scrollWidth > node.clientWidth
      if (canOverflow && hasOverflow) {
        return node
      }
    }
    node = node.parentElement
  }
  return null
}

/** Whether `scroller` can still scroll in the direction the finger/pointer moves on screen. */
function canScrollInGestureDirection(
  scroller: HTMLElement,
  vertical: boolean,
  screenDelta: number,
  rtl: boolean,
): boolean {
  if (vertical) {
    if (screenDelta > 0) {
      return scroller.scrollTop > 0
    }
    return scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 1
  }
  // `scrollLeft` is <= 0 in RTL; normalize to an offset that grows toward content end.
  const scrollOffset = rtl ? -scroller.scrollLeft : scroller.scrollLeft
  const maxOffset = scroller.scrollWidth - scroller.clientWidth
  const towardEnd = rtl ? screenDelta > 0 : screenDelta < 0
  return towardEnd ? scrollOffset < maxOffset - 1 : scrollOffset > 0
}

function touchById(touches: TouchList, id: number): Touch | undefined {
  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches[index]
    if (touch?.identifier === id) {
      return touch
    }
  }
  return undefined
}

function swipeIgnoreMatch(target: EventTarget | null, vertical: boolean, touch: boolean): boolean {
  if (!(target instanceof Element)) {
    return false
  }
  const ignored = target.closest(SWIPE_IGNORE_SELECTOR)
  if (!ignored) {
    return false
  }
  if (!touch) {
    return true
  }
  const axis = ignored.closest('[data-swipe-ignore]')?.getAttribute('data-swipe-ignore')
  return axis !== 'x' && axis !== 'y' ? true : axis === (vertical ? 'y' : 'x')
}

function isRtl(element: HTMLElement): boolean {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
}

interface DragState {
  startX: number
  startY: number
  startTime: number
  pointerId?: number
  touchId?: number
  /** A touch scrollable ancestor that may win the gesture until it reaches its edge. */
  scrollTarget: HTMLElement | null
  /** `direction: rtl` of `scrollTarget`, resolved once at gesture start. */
  scrollRtl: boolean
  /** A scrollable ancestor on the cross axis that may own the gesture natively. */
  crossScrollable: boolean
  abandoned: boolean
  /**
   * Reversed past `REVERSE_CANCEL_THRESHOLD` after locking the dismiss axis: the
   * release snaps back instead of settling or dismissing.
   */
  cancelled: boolean
  /** Whether the press origin has been absorbed into the first move position. */
  moved: boolean
  /** Set when a pointermove still reports the primary button down. */
  sawPrimaryButtons: boolean
  lastX: number
  lastY: number
  /** Previous move's raw axis delta, for per-move direction and cancel baselines. */
  lastMain: number
  /** Displacement of the deepest point of the current retreat, for reverse-cancel. */
  cancelBaseD: number
  /** Displacement when the gesture claimed the axis. */
  lockD: number
  /** Timestamp and axis displacement of the last recorded moving sample. */
  sampleTime?: number
  sampleValue: number
  /** Instantaneous velocity between the last two moving samples, dismiss-signed. */
  lastVelocity: number
  stationarySeen: boolean
  docCleanup?: VoidFunction
}

function createDrag(
  x: number,
  y: number,
  scrollTarget: HTMLElement | null,
  crossScrollable: boolean,
): DragState {
  return {
    startX: x,
    startY: y,
    startTime: performance.now(),
    scrollTarget,
    scrollRtl: scrollTarget !== null && isRtl(scrollTarget),
    crossScrollable,
    abandoned: false,
    cancelled: false,
    moved: false,
    sawPrimaryButtons: false,
    lastX: x,
    lastY: y,
    lastMain: 0,
    cancelBaseD: 0,
    lockD: 0,
    sampleValue: 0,
    lastVelocity: 0,
    stationarySeen: false,
  }
}

export interface DrawerSwipeOptions {
  open: Accessor<boolean>
  direction: Accessor<DrawerSwipeDirection>
  close: () => void
  snapPoints: Accessor<readonly DrawerT.SnapPoint[] | undefined>
  snapPoint: Accessor<DrawerT.SnapPoint | null>
  setSnapPoint: (point: DrawerT.SnapPoint | null) => void
  snapToSequentialPoints: Accessor<boolean>
  /**
   * While true the popup's measured size is forced (a nested stack pins it to
   * the frontmost height), so measurements are skipped and the last unforced
   * size is kept as its own.
   */
  sizeFrozen: Accessor<boolean>
}

export interface DrawerSwipeController {
  /** Whether a swipe gesture is currently dragging the content. */
  swiping: Accessor<boolean>
  /** Current swipe offset in screen coordinates (+down/+right), damped past the open edge. */
  movement: Accessor<number>
  /** The snap point offset as a CSS length for the content's `--drawer-snap-point-offset` var. */
  snapPointOffsetCss: Accessor<string>
  /** Dismissal progress in [0, 1] used for overlay opacity. */
  progress: Accessor<number>
  /** Measured popup height in px, kept current by a ResizeObserver. */
  popupHeight: Accessor<number>
  /** Binds the gesture to the content element for the element's lifetime. */
  attach: (element: HTMLElement) => void
}

/**
 * Swipe-to-dismiss and snap-point gesture controller for Drawer.Content.
 * Bind it to the content element in the render owner that mounts it.
 */
export function createDrawerSwipe(options: DrawerSwipeOptions): DrawerSwipeController {
  const [swiping, setSwiping] = createSignal(false)
  const [displacement, setDisplacement] = createSignal(0)
  const [popupHeight, setPopupHeight] = createSignal(0)
  const [popupWidth, setPopupWidth] = createSignal(0)
  const [viewportHeight, setViewportHeight] = createSignal(0)
  const [rootFontSize, setRootFontSize] = createSignal(16)

  let drag: DragState | null = null

  const vertical = () => isVertical(options.direction())

  const popupSize = () => (vertical() ? popupHeight() : popupWidth())

  const resolvedSnapPoints = createMemo(() => {
    if (!vertical()) {
      return []
    }
    return resolveSnapPoints(options.snapPoints(), popupSize(), viewportHeight(), rootFontSize())
  })

  const activeSnapPoint = createMemo((): ResolvedDrawerSnapPoint | undefined => {
    const active = options.snapPoint()
    const resolved = resolvedSnapPoints()
    if (active === null || resolved.length === 0) {
      return undefined
    }

    const exactMatch = resolved.find((point) => Object.is(point.value, active))
    if (exactMatch) {
      return exactMatch
    }

    const maxHeight = Math.min(popupSize(), viewportHeight())
    const resolvedHeight = resolveSnapPointValue(active, viewportHeight(), rootFontSize())
    if (resolvedHeight === null) {
      return undefined
    }

    const clampedHeight = clampSnapValue(resolvedHeight, 0, maxHeight)
    return resolved[
      closestSnapPointIndex(
        resolved.map((point) => point.height),
        clampedHeight,
      )
    ]
  })

  const snapPointOffset = () =>
    resolvedSnapPoints().length > 0 ? (activeSnapPoint()?.offset ?? 0) : 0

  // Declared snap points keep a pure-CSS offset (element height minus snap
  // height) so the first style resolution is already correct — swapping in the
  // measured value afterwards changes nothing and fires no translate transition.
  const snapPointOffsetCss = (): string => {
    const active = options.snapPoint()
    const snapPoints = options.snapPoints()
    if (
      active === null ||
      snapPoints === undefined ||
      !vertical() ||
      !snapPoints.some((point) => Object.is(point, active))
    ) {
      return `${snapPointOffset()}px`
    }
    return `max(0px, calc(100% - ${snapPointHeightCss(active)}), calc(100% - 100dvh))`
  }

  const hasSnapPoints = () => resolvedSnapPoints().length > 0

  // Within the open-edge bound the drag translates the popup; past it the
  // displacement is rubber-banded so the popup barely gives.
  const movement = createMemo(() => {
    const raw = displacement()
    const limit = -snapPointOffset()
    const translate = raw >= limit ? raw : limit + dampen(raw - limit)
    return translate * screenSign(options.direction())
  })

  const progress = createMemo(() => {
    const size = popupSize()
    if (size <= 0) {
      return 0
    }
    return clampSnapValue((snapPointOffset() + displacement()) / size, 0, 1)
  })

  function resetDrag(): void {
    setDisplacement(0)
    setSwiping(false)
  }

  function recordSample(state: DragState, main: number): void {
    const time = performance.now()
    const sampleTime = state.sampleTime
    if (sampleTime === undefined || time <= sampleTime) {
      state.sampleTime = time
      state.sampleValue = main
      return
    }
    // Some Android devices emit one effectively stationary move immediately before release.
    // Keep the last moving sample and its velocity; repeated stationary moves still clear it.
    const stationary = Math.abs(main - state.sampleValue) < MIN_VELOCITY_SAMPLE_DISTANCE
    const skip = stationary && !state.stationarySeen
    state.stationarySeen = stationary
    if (!skip) {
      state.lastVelocity =
        ((main - state.sampleValue) /
          Math.max(time - sampleTime, MIN_RELEASE_VELOCITY_DURATION_MS)) *
        screenSign(options.direction())
      state.sampleTime = time
      state.sampleValue = main
    }
  }

  function settleDrag(state: DragState, released: boolean, endX: number, endY: number): void {
    if (!released || state.cancelled) {
      resetDrag()
      return
    }

    const sign = screenSign(options.direction())
    const endMain = vertical() ? endY - state.startY : endX - state.startX
    const d = endMain * sign
    const size = popupSize()
    const now = performance.now()

    // Release velocity: the terminal flick from the last moving sample. A release
    // long after the final move expires it so hold-then-release stays slow.
    let releaseVelocity = state.lastVelocity
    const sampleTime = state.sampleTime
    if (sampleTime !== undefined && now >= sampleTime) {
      const age = now - sampleTime
      if (age <= MAX_RELEASE_VELOCITY_AGE_MS) {
        const delta = endMain - state.sampleValue
        if (Math.abs(delta) >= MIN_VELOCITY_SAMPLE_DISTANCE) {
          releaseVelocity = (delta / Math.max(age, MIN_RELEASE_VELOCITY_DURATION_MS)) * sign
        }
      } else {
        releaseVelocity = 0
      }
    }

    const duration = now - state.startTime
    const durationMs = duration > 0 ? Math.max(duration, MIN_VELOCITY_DURATION_MS) : 0
    const overall = durationMs > 0 ? (endMain / durationMs) * sign : 0
    let directionalVelocity = Math.abs(releaseVelocity) > 0 ? releaseVelocity : overall

    if (!hasSnapPoints()) {
      const shouldClose =
        d > 0 &&
        (directionalVelocity >= FAST_SWIPE_VELOCITY ||
          d > Math.max(size * 0.5, MIN_SWIPE_THRESHOLD))
      if (shouldClose) {
        closeSwipe()
      } else {
        resetDrag()
      }
      return
    }

    // Snap point release: choose between the closest snap point and closing.
    if (size <= 0 || resolvedSnapPoints().length === 0) {
      resetDrag()
      return
    }

    const dragDelta = d
    const dragDirection = Math.sign(dragDelta)
    if (
      dragDirection !== 0 &&
      Math.abs(dragDelta) >= MIN_SWIPE_THRESHOLD &&
      Math.sign(directionalVelocity) !== 0 &&
      Math.sign(directionalVelocity) !== dragDirection
    ) {
      // A reversed flick should not flip the snap decision.
      directionalVelocity = overall
    }

    const currentOffset = snapPointOffset()
    const dragTargetOffset = clampSnapValue(currentOffset + dragDelta, 0, size)
    const velocityOffset =
      Math.abs(directionalVelocity) >= SNAP_VELOCITY_THRESHOLD
        ? clampSnapValue(directionalVelocity, -MAX_SNAP_VELOCITY, MAX_SNAP_VELOCITY) *
          SNAP_VELOCITY_MULTIPLIER
        : 0
    const sequential = options.snapToSequentialPoints()
    const targetOffset = sequential
      ? dragTargetOffset
      : clampSnapValue(dragTargetOffset + velocityOffset, 0, size)

    const settleOnSnapPoint = (point: ResolvedDrawerSnapPoint): void => {
      options.setSnapPoint(point.value)
      resetDrag()
    }

    const closeFromSnapPoints = (fallback: ResolvedDrawerSnapPoint): void => {
      if (dragDirection === 0) {
        settleOnSnapPoint(fallback)
        return
      }
      closeSwipe()
    }

    if (sequential) {
      const ordered = [...resolvedSnapPoints()].sort((a, b) => a.offset - b.offset)
      const orderedOffsets = ordered.map((point) => point.offset)
      const currentIndex = closestSnapPointIndex(orderedOffsets, currentOffset)
      let target = ordered[closestSnapPointIndex(orderedOffsets, targetOffset)]!
      let effectiveTargetOffset = targetOffset

      const shouldAdvance =
        dragDirection !== 0 &&
        Math.sign(directionalVelocity) === dragDirection &&
        Math.abs(directionalVelocity) >= SNAP_VELOCITY_THRESHOLD
      if (shouldAdvance) {
        const adjacentIndex = clampSnapValue(currentIndex + dragDirection, 0, ordered.length - 1)
        if (adjacentIndex !== currentIndex) {
          const adjacent = ordered[adjacentIndex]!
          const shouldForceAdjacent =
            dragDirection > 0 ? targetOffset < adjacent.offset : targetOffset > adjacent.offset
          if (shouldForceAdjacent) {
            target = adjacent
            effectiveTargetOffset = adjacent.offset
          }
        } else if (dragDirection > 0) {
          closeFromSnapPoints(target)
          return
        }
      }

      const closeDistance = Math.abs(effectiveTargetOffset - size)
      const snapDistance = Math.abs(effectiveTargetOffset - target.offset)
      if (closeDistance < snapDistance) {
        closeFromSnapPoints(target)
      } else {
        settleOnSnapPoint(target)
      }
      return
    }

    const closest =
      resolvedSnapPoints()[
        closestSnapPointIndex(
          resolvedSnapPoints().map((point) => point.offset),
          targetOffset,
        )
      ]!

    // A fast dismiss flick closes only from the lowest snap point; elsewhere the
    // velocity-projected target below picks the resting point.
    const lowestOffset = resolvedSnapPoints().reduce((max, point) => Math.max(max, point.offset), 0)
    if (
      directionalVelocity >= FAST_SWIPE_VELOCITY &&
      dragDelta > 0 &&
      currentOffset >= lowestOffset
    ) {
      closeFromSnapPoints(closest)
      return
    }

    const closeDistance = Math.abs(targetOffset - size)
    if (closeDistance < Math.abs(targetOffset - closest.offset)) {
      closeFromSnapPoints(closest)
    } else {
      settleOnSnapPoint(closest)
    }
  }

  function closeSwipe(): void {
    // Keep the last movement so the exit animation starts from the drag position.
    setSwiping(false)
    options.close()
    queueMicrotask(() => {
      if (options.open()) {
        // A controlled parent refused the close: animate back to rest.
        resetDrag()
      }
    })
  }

  function endDrag(
    state: DragState,
    released: boolean,
    endX = state.lastX,
    endY = state.lastY,
  ): void {
    state.docCleanup?.()
    if (drag === state) {
      drag = null
    }
    if (state.abandoned || !swiping()) {
      resetDrag()
      return
    }
    setSwiping(false)
    settleDrag(state, released, endX, endY)
  }

  /** Whether another overlay opened above this drawer (e.g. a nested drawer). */
  let blocked: () => boolean = () => false

  function updateDrag(state: DragState, x: number, y: number): boolean {
    // Returns true once the gesture owns the drag (caller may preventDefault).
    if (state.abandoned) {
      return false
    }
    if (!state.moved) {
      // The first move replaces the press position as the drag origin: iOS touch
      // delivers the first touchmove already offset from touchstart, which would
      // otherwise jump the content. The absorbed move still seeds tracking.
      state.moved = true
      state.startX = x
      state.startY = y
      state.startTime = performance.now()
      state.lastX = x
      state.lastY = y
      state.lastMain = 0
      return false
    }

    const dx = x - state.startX
    const dy = y - state.startY
    const vert = vertical()
    const main = vert ? dy : dx
    const cross = vert ? dx : dy
    const sign = screenSign(options.direction())
    const d = main * sign
    const moveD = (main - state.lastMain) * sign
    const moveMain = vert ? y - state.lastY : x - state.lastX
    state.lastX = x
    state.lastY = y
    state.lastMain = main

    if (!swiping()) {
      if (Math.abs(main) < AXIS_LOCK_SLOP && Math.abs(cross) < AXIS_LOCK_SLOP) {
        return false
      }
      if (Math.abs(cross) > Math.abs(main)) {
        // The cross axis won the gesture; this decision is permanent.
        state.abandoned = true
        return false
      }
      if (blocked()) {
        return false
      }
      if (
        state.scrollTarget &&
        canScrollInGestureDirection(state.scrollTarget, vert, moveMain, state.scrollRtl)
      ) {
        // The scroller still has room in the move direction: yield this move and
        // re-arbitrate on the next one, so reaching the scroll edge hands the
        // rest of the gesture back to the drawer.
        return false
      }
      state.lockD = d
      setSwiping(true)
    }

    // Reverse-cancel: track the deepest point of the current retreat. Receding
    // `REVERSE_CANCEL_THRESHOLD` below it cancels; recovering a full dismiss
    // threshold from the retreat re-arms the swipe. Skipped for snap points:
    // there the reverse direction expands toward a larger point, so a retreat
    // is a valid gesture, not a change of mind.
    if (!hasSnapPoints()) {
      if ((moveD < 0 && d > state.cancelBaseD) || (moveD > 0 && d < state.cancelBaseD)) {
        state.cancelBaseD = d
      }
      const cancelD = d - state.cancelBaseD
      if (cancelD > Math.max(popupSize() * 0.5, MIN_SWIPE_THRESHOLD)) {
        state.cancelled = false
      } else if (state.lockD - cancelD >= REVERSE_CANCEL_THRESHOLD) {
        state.cancelled = true
      }
    }

    recordSample(state, main)
    setDisplacement(d)
    return true
  }

  function clearContentSelection(content: HTMLElement): void {
    const selection = content.ownerDocument.getSelection?.()
    if (!selection || selection.isCollapsed) {
      return
    }
    const anchor =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode?.parentElement
    const focus =
      selection.focusNode instanceof Element
        ? selection.focusNode
        : selection.focusNode?.parentElement
    if (anchor && content.contains(anchor) && focus && content.contains(focus)) {
      selection.removeAllRanges()
    }
  }

  function attach(content: HTMLElement): void {
    // The content mounts fresh on each open; drop any state left by a swipe close.
    drag = null
    resetDrag()

    const ownerWindow = content.ownerDocument.defaultView
    const ownerDocument = content.ownerDocument
    blocked = () => containsOverlayContentAbove(content, ownerDocument.documentElement)

    function measureSize(): void {
      if (!options.sizeFrozen()) {
        setPopupHeight(content.offsetHeight)
        setPopupWidth(content.offsetWidth)
      }
    }
    // Kept off the ResizeObserver path: `getComputedStyle` forces style
    // resolution, and the observer fires per frame during size transitions.
    function measureViewport(): void {
      setViewportHeight(ownerWindow?.innerHeight ?? 0)
      const fontSize = Number.parseFloat(
        ownerWindow?.getComputedStyle(ownerDocument.documentElement).fontSize ?? '',
      )
      if (Number.isFinite(fontSize)) {
        setRootFontSize(fontSize)
      }
    }
    measureSize()
    measureViewport()

    function onPointerDown(event: PointerEvent): void {
      // A live gesture owns the drag; a second pointer must not replace it, or the
      // first pointer's release would settle against the new gesture's state.
      if (drag || event.pointerType === 'touch' || !options.open()) {
        return
      }
      if (event.button !== 0) {
        return
      }
      if (blocked() || swipeIgnoreMatch(event.target, vertical(), false)) {
        return
      }
      if (event.target instanceof Element && event.target.closest(SWIPE_BODY_SELECTOR)) {
        return
      }

      clearContentSelection(content)
      drag = createDrag(event.clientX, event.clientY, null, false)
      drag.pointerId = event.pointerId

      const state = drag
      // Pointer drags capture on swipe start so clicks aren't retargeted beforehand.
      let captured = false
      function finish(released: boolean, x?: number, y?: number): void {
        if (captured) {
          captured = false
          try {
            content.releasePointerCapture?.(event.pointerId)
          } catch {
            // Pointer capture is best-effort, matching the set path.
          }
        }
        endDrag(state, released, x, y)
      }
      state.docCleanup = attachEventListenerMap(ownerDocument, {
        pointermove: (moveEvent) => {
          if (moveEvent.pointerId !== state.pointerId) {
            return
          }
          const hasPrimaryButton = (moveEvent.buttons & 1) === 1
          if (hasPrimaryButton) {
            state.sawPrimaryButtons = true
          }
          // A non-primary button taking over the interaction (e.g. a right-click
          // mid-drag) cancels the swipe.
          if (moveEvent.buttons !== 0 && !hasPrimaryButton) {
            finish(false)
            return
          }
          // A `buttons: 0` move means the primary button was already released and
          // no pointerup reached us (fast trackpad flicks): treat this trailing
          // move as the release — it may itself carry the decisive displacement.
          if (moveEvent.buttons === 0 && state.sawPrimaryButtons) {
            updateDrag(state, moveEvent.clientX, moveEvent.clientY)
            finish(true, moveEvent.clientX, moveEvent.clientY)
            return
          }
          if (updateDrag(state, moveEvent.clientX, moveEvent.clientY) && !captured) {
            captured = true
            try {
              content.setPointerCapture?.(moveEvent.pointerId)
            } catch {
              // Environments without pointer capture (jsdom) still receive document events.
            }
          }
        },
        pointerup: (upEvent) => {
          if (upEvent.pointerId !== state.pointerId) {
            return
          }
          finish(true, upEvent.clientX, upEvent.clientY)
        },
        pointercancel: () => {
          finish(false)
        },
      })
    }

    function onTouchStart(event: TouchEvent): void {
      if (drag || !options.open() || event.touches.length !== 1) {
        return
      }
      if (blocked() || swipeIgnoreMatch(event.target, vertical(), true)) {
        return
      }
      const touch = event.touches[0]!
      drag = createDrag(
        touch.clientX,
        touch.clientY,
        findScrollableAncestor(event.target, content, vertical()),
        findScrollableAncestor(event.target, content, !vertical()) !== null,
      )
      drag.touchId = touch.identifier
    }

    function onTouchMove(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined || state.abandoned) {
        return
      }
      if (!event.cancelable) {
        // The browser already committed this touch to native scrolling or
        // pinch; it cannot be interrupted, so stop tracking the gesture.
        state.abandoned = true
        return
      }
      // Leave pinch zoom and two-finger selection adjustments to the browser.
      if (event.touches.length !== 1) {
        return
      }
      const touch = touchById(event.touches, state.touchId)
      if (!touch) {
        return
      }
      const claimed = updateDrag(state, touch.clientX, touch.clientY)
      // Claim gestures with no scrollable ancestor immediately: once the
      // browser commits a touch to native scrolling, every later move is
      // non-cancelable and the drag can no longer take it back.
      if (claimed || (!state.scrollTarget && !state.crossScrollable)) {
        event.preventDefault()
      }
    }

    function onTouchEnd(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined) {
        return
      }
      const touch = touchById(event.changedTouches, state.touchId)
      endDrag(state, !state.abandoned, touch?.clientX ?? state.lastX, touch?.clientY ?? state.lastY)
    }

    function onTouchCancel(): void {
      const state = drag
      if (!state || state.touchId === undefined) {
        return
      }
      endDrag(state, false)
    }

    createEventListener(ownerWindow, 'resize', () => {
      measureSize()
      measureViewport()
    })
    createEventListener(content, 'pointerdown', onPointerDown)
    createEventListener(content, 'touchstart', onTouchStart)
    createEventListener(content, 'touchmove', onTouchMove, { passive: false })
    createEventListenerMap(content, {
      touchend: onTouchEnd,
      touchcancel: onTouchCancel,
    })

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measureSize)
      observer.observe(content)
      onCleanup(() => observer.disconnect())
    }

    onCleanup(() => {
      drag?.docCleanup?.()
      drag = null
    })
  }

  return {
    swiping,
    movement,
    snapPointOffsetCss,
    progress,
    popupHeight,
    attach,
  }
}
