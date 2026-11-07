import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'

import {
  attachEventListenerMap,
  createEventListener,
  createEventListenerMap,
} from '../../shared/event-listener'
import type { ModalContext } from '../modal/modal-context'
import { containsComposed, getActiveElement, isElement } from '../shared/overlay/dom'
import { containsOverlayContentAbove } from '../shared/overlay/overlay-stack'

import type { DrawerContextValue } from './drawer-context'
import type { ResolvedDrawerSnapPoint } from './drawer-snap-points'
import {
  clamp,
  closestSnapPointIndex,
  resolveSnapPointValue,
  resolveSnapPoints,
  snapPointHeightCss,
} from './drawer-snap-points'
import type { DrawerT } from './drawer.types'

const AXIS_LOCK_SLOP = 6
const AXIS_LOCK_BIAS = 2
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
const SWIPE_IGNORE_SELECTOR_BASE = '[data-swipe-ignore]'
const axisSwipeIgnoreSelector = (axis: 'x' | 'y'): string => `[data-swipe-ignore="${axis}"]`

/** `event.timeStamp` shares the `performance.now()` epoch; fall back when missing. */
function eventTime(timeStamp: number | undefined): number {
  return Number.isFinite(timeStamp) && (timeStamp ?? 0) > 0
    ? (timeStamp as number)
    : performance.now()
}

/**
 * The element's current rendered translate on screen axes, or `null` when the
 * computed transform isn't a resolved matrix (e.g. `none`, or an unresolved
 * `var()` in a DOM that can't evaluate it) — where the resting position is the
 * only reasonable guess.
 */
function getElementTranslate(element: HTMLElement): { x: number; y: number } | null {
  const transform = element.ownerDocument.defaultView?.getComputedStyle(element).transform
  if (!transform || transform === 'none') {
    return null
  }
  const match = /^matrix(3d)?\(([^)]+)\)$/.exec(transform)
  if (!match) {
    return null
  }
  const parts = match[2]!.split(',').map(Number.parseFloat)
  return match[1] === '3d'
    ? { x: parts[12] ?? 0, y: parts[13] ?? 0 }
    : { x: parts[4] ?? 0, y: parts[5] ?? 0 }
}

/** Past the open edge the popup rubber-bands: extra distance falls off with `sqrt`. */
function dampen(delta: number): number {
  return -Math.sqrt(-delta)
}

interface ScrollableTargets {
  scrollTarget: HTMLElement | null
  crossScrollable: boolean
  scrollRtl: boolean
}

function findScrollableTargets(
  target: EventTarget | null,
  boundary: HTMLElement,
  vertical: boolean,
): ScrollableTargets {
  let node = target instanceof Element ? target : null
  let scrollTarget: HTMLElement | null = null
  let crossScrollable = false
  let scrollRtl = false

  while (node && node !== boundary) {
    if (node instanceof HTMLElement) {
      const style = node.ownerDocument.defaultView?.getComputedStyle(node)
      if (style) {
        const mainOverflow = vertical ? style.overflowY : style.overflowX
        const crossOverflow = vertical ? style.overflowX : style.overflowY
        if (
          !scrollTarget &&
          (mainOverflow === 'auto' || mainOverflow === 'scroll') &&
          (vertical ? node.scrollHeight > node.clientHeight : node.scrollWidth > node.clientWidth)
        ) {
          scrollTarget = node
          scrollRtl = style.direction === 'rtl'
        }
        if (
          !crossScrollable &&
          (crossOverflow === 'auto' || crossOverflow === 'scroll') &&
          (vertical ? node.scrollWidth > node.clientWidth : node.scrollHeight > node.clientHeight)
        ) {
          crossScrollable = true
        }
        if (scrollTarget && crossScrollable) {
          break
        }
      }
    }
    node = node.parentElement
  }

  return { scrollTarget, crossScrollable, scrollRtl }
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
  if (!touch) {
    return target.closest(SWIPE_IGNORE_SELECTOR) !== null
  }
  // Touch drags may start on interactive elements; only `data-swipe-ignore`
  // opts out. A cross-axis value does not ignore the gesture, the element is
  // arbitrated like a native cross-axis scroller instead. Matching any further
  // ancestor keeps an all-direction marker effective over a nested axis value.
  const crossAxis = axisSwipeIgnoreSelector(vertical ? 'x' : 'y')
  return target.closest(`${SWIPE_IGNORE_SELECTOR_BASE}:not(${crossAxis})`) !== null
}

function isTextSelectionControl(target: Element): target is HTMLInputElement | HTMLTextAreaElement {
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}

function selectionEndpointElement(node: Node | null): Element | null {
  if (!node) {
    return null
  }
  return isElement(node) ? node : node.parentElement
}

function hasExpandedSelectionWithinTarget(selection: Selection, target: Element): boolean {
  const anchorElement = selectionEndpointElement(selection.anchorNode)
  const focusElement = selectionEndpointElement(selection.focusNode)
  return (
    (typeof selection.containsNode === 'function' && selection.containsNode(target, true)) ||
    (anchorElement !== null && containsComposed(target, anchorElement)) ||
    (focusElement !== null && containsComposed(target, focusElement))
  )
}

/**
 * An expanded text selection inside `content` owns the touch drag (selection
 * handles), so a swipe may not start from it.
 */
function shouldIgnoreSwipeForTextSelection(content: HTMLElement): boolean {
  const doc = content.ownerDocument
  const active = getActiveElement(doc)
  if (active && containsComposed(content, active) && isTextSelectionControl(active)) {
    let start: number | null = null
    let end: number | null = null
    try {
      start = active.selectionStart
      end = active.selectionEnd
    } catch {
      // Input types like `number` throw on selection property access.
    }
    if (start !== null && end !== null && start < end) {
      return true
    }
  }
  const selection = doc.getSelection?.()
  if (!selection || selection.isCollapsed) {
    return false
  }
  return hasExpandedSelectionWithinTarget(selection, content)
}

interface DragState {
  startX: number
  startY: number
  startTime: number
  touchId?: number
  /** A touch scrollable ancestor that may win the gesture until it reaches its edge. */
  scrollTarget: HTMLElement | null
  /** `direction: rtl` of `scrollTarget`, resolved once at gesture start. */
  scrollRtl: boolean
  /**
   * A cross-axis gesture consumer at the press origin — a native cross-axis
   * scroller or an axis-marked `data-swipe-ignore` element — which may win the
   * gesture when the cross axis leads.
   */
  crossAxisTarget: boolean
  abandoned: boolean
  /**
   * Reversed past `REVERSE_CANCEL_THRESHOLD` after locking the dismiss axis: the
   * release snaps back instead of settling or dismissing.
   */
  cancelled: boolean
  /** Whether the press origin has been absorbed into the first move position. */
  moved: boolean
  lastX: number
  lastY: number
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
  timeStamp?: number,
  scrollTarget: HTMLElement | null = null,
  crossAxisTarget = false,
  scrollRtl = false,
): DragState {
  return {
    startX: x,
    startY: y,
    startTime: eventTime(timeStamp),
    scrollTarget,
    scrollRtl,
    crossAxisTarget,
    abandoned: false,
    cancelled: false,
    moved: false,
    lastX: x,
    lastY: y,
    cancelBaseD: 0,
    lockD: 0,
    sampleValue: 0,
    lastVelocity: 0,
    stationarySeen: false,
  }
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
  /** Binds the gesture to the content element for the element's lifetime. */
  attach: (element: HTMLElement) => void
}

/**
 * Swipe-to-dismiss and snap-point gesture controller for Drawer.Content.
 * Bind it to the content element in the render owner that mounts it.
 */
export function createDrawerSwipe(
  drawer: DrawerContextValue,
  modal: ModalContext,
  side: Accessor<NonNullable<DrawerT.Variants['side']>>,
): DrawerSwipeController {
  const [swiping, setSwiping] = createSignal(false)
  const [displacement, setDisplacement] = createSignal(0)
  // The rendered translate captured when the gesture claimed the drag, so a
  // swipe mid enter/snap transition continues from the visual position.
  const [baseline, setBaseline] = createSignal(0)
  const [popupWidth, setPopupWidth] = createSignal(0)
  const [viewportHeight, setViewportHeight] = createSignal(0)
  const [rootFontSize, setRootFontSize] = createSignal(16)

  // The content element the gesture is bound to, for transform reads at claim.
  let swipeElement: HTMLElement | null = null

  let drag: DragState | null = null

  const vertical = () => side() === 'top' || side() === 'bottom'
  /** Sign that maps dismiss-direction displacement onto screen coordinates (+down/+right). */
  const screenSign = () => (side() === 'bottom' || side() === 'right' ? 1 : -1)

  const popupHeight = drawer.nested.popupHeight
  const popupSize = () => (vertical() ? popupHeight() : popupWidth())

  const resolvedSnapPoints = createMemo(() =>
    vertical()
      ? resolveSnapPoints(drawer.snapPoints, popupHeight(), viewportHeight(), rootFontSize())
      : [],
  )

  const snapPointOffset = createMemo(() => {
    const active = drawer.snapPoint()
    const points = resolvedSnapPoints()
    if (active === null || points.length === 0) {
      return 0
    }
    const match = points.find((point) => Object.is(point.value, active))
    if (match) {
      return match.offset
    }
    const resolvedHeight = resolveSnapPointValue(active, viewportHeight(), rootFontSize())
    if (resolvedHeight === null) {
      return 0
    }
    const clampedHeight = clamp(resolvedHeight, 0, Math.min(popupHeight(), viewportHeight()))
    const targetOffset = Math.max(0, popupHeight() - clampedHeight)
    return points[closestSnapPointIndex(points, targetOffset)]!.offset
  })

  // Declared snap points keep a pure-CSS offset (element height minus snap
  // height) so the first style resolution is already correct — swapping in the
  // measured value afterwards changes nothing and fires no translate transition.
  const snapPointOffsetCss = (): string => {
    const active = drawer.snapPoint()
    return active !== null &&
      vertical() &&
      drawer.snapPoints?.some((point) => Object.is(point, active))
      ? `max(0px, calc(100% - ${snapPointHeightCss(active)}), calc(100% - 100dvh))`
      : `${snapPointOffset()}px`
  }

  const dismissThreshold = () => Math.max(popupSize() * 0.5, MIN_SWIPE_THRESHOLD)

  // Within the open-edge bound the drag translates the popup; past it the
  // displacement is rubber-banded so the popup barely gives. `baseline` keeps
  // the translate the element had when the gesture claimed it.
  const movement = (): number => {
    const raw = baseline() + displacement()
    const limit = -snapPointOffset()
    const translate = raw >= limit ? raw : limit + dampen(raw - limit)
    return translate * screenSign()
  }

  const progress = createMemo(() => {
    const size = popupSize()
    if (size <= 0) {
      return 0
    }
    return clamp((snapPointOffset() + baseline() + displacement()) / size, 0, 1)
  })

  function clearDragDisplacement(): void {
    setDisplacement(0)
    setBaseline(0)
  }

  function resetDrag(): void {
    clearDragDisplacement()
    setSwiping(false)
  }

  function recordSample(state: DragState, main: number, timeStamp?: number): void {
    const time = eventTime(timeStamp)
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
        screenSign()
      state.sampleTime = time
      state.sampleValue = main
    }
  }

  function settleDrag(state: DragState, endX: number, endY: number, timeStamp?: number): void {
    const sign = screenSign()
    const endMain = vertical() ? endY - state.startY : endX - state.startX
    const d = endMain * sign
    const now = eventTime(timeStamp)

    const duration = now - state.startTime
    const overall =
      duration > 0 ? (endMain / Math.max(duration, MIN_VELOCITY_DURATION_MS)) * sign : 0

    // Release velocity: the terminal flick from the last moving sample. A release
    // long after the final move expires it so hold-then-release stays slow.
    let velocity = state.lastVelocity
    if (state.sampleTime !== undefined) {
      const age = now - state.sampleTime
      const delta = endMain - state.sampleValue
      if (age > MAX_RELEASE_VELOCITY_AGE_MS) {
        velocity = 0
      } else if (Math.abs(delta) >= MIN_VELOCITY_SAMPLE_DISTANCE) {
        velocity = (delta / Math.max(age, MIN_RELEASE_VELOCITY_DURATION_MS)) * sign
      }
    } else {
      velocity = overall
    }

    const points = resolvedSnapPoints()
    if (points.length === 0) {
      if (d > 0 && (velocity >= FAST_SWIPE_VELOCITY || d > dismissThreshold())) {
        closeSwipe()
      } else {
        clearDragDisplacement()
      }
      return
    }

    if (Math.abs(d) >= MIN_SWIPE_THRESHOLD && velocity * d < 0) {
      // A reversed flick should not flip the snap decision.
      velocity = overall
    }

    const size = popupSize()
    const direction = Math.sign(d)
    const currentOffset = snapPointOffset()
    let targetOffset = clamp(currentOffset + d, 0, size)
    let target: ResolvedDrawerSnapPoint
    if (drawer.snapToSequentialPoints) {
      const ordered = [...points].sort((a, b) => a.offset - b.offset)
      target = ordered[closestSnapPointIndex(ordered, targetOffset)]!
      if (velocity * direction >= SNAP_VELOCITY_THRESHOLD) {
        const adjacent = ordered[closestSnapPointIndex(ordered, currentOffset) + direction]
        if (!adjacent) {
          if (direction > 0) {
            closeSwipe()
            return
          }
        } else if ((adjacent.offset - targetOffset) * direction > 0) {
          target = adjacent
          targetOffset = adjacent.offset
        }
      }
    } else {
      if (Math.abs(velocity) >= SNAP_VELOCITY_THRESHOLD) {
        targetOffset = clamp(
          targetOffset +
            clamp(velocity, -MAX_SNAP_VELOCITY, MAX_SNAP_VELOCITY) * SNAP_VELOCITY_MULTIPLIER,
          0,
          size,
        )
      }
      target = points[closestSnapPointIndex(points, targetOffset)]!
      // A fast dismiss flick closes only from the lowest snap point; elsewhere the
      // velocity-projected target below picks the resting point.
      let maxOffset = 0
      for (let index = 0; index < points.length; index += 1) {
        if (points[index]!.offset > maxOffset) {
          maxOffset = points[index]!.offset
        }
      }
      if (velocity >= FAST_SWIPE_VELOCITY && d > 0 && currentOffset >= maxOffset) {
        closeSwipe()
        return
      }
    }

    // Snap point release: choose between the closest snap point and closing.
    if (direction !== 0 && Math.abs(targetOffset - size) < Math.abs(targetOffset - target.offset)) {
      closeSwipe()
    } else {
      drawer.setSnapPoint(target.value)
      clearDragDisplacement()
    }
  }

  function closeSwipe(): void {
    // Keep the last movement so the exit animation starts from the drag position.
    modal.updateOpen(false)
    queueMicrotask(() => {
      if (modal.open()) {
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
    timeStamp?: number,
  ): void {
    state.docCleanup?.()
    if (drag === state) {
      drag = null
    }
    const settle = released && swiping() && !state.abandoned && !state.cancelled
    setSwiping(false)
    if (settle) {
      settleDrag(state, endX, endY, timeStamp)
    } else {
      clearDragDisplacement()
    }
  }

  /** Whether another overlay opened above this drawer (e.g. a nested drawer). */
  let blocked: () => boolean = () => false

  function updateDrag(state: DragState, x: number, y: number, timeStamp?: number): boolean {
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
      state.startTime = eventTime(timeStamp)
      state.lastX = x
      state.lastY = y
      return false
    }

    const dx = x - state.startX
    const dy = y - state.startY
    const vert = vertical()
    const main = vert ? dy : dx
    const cross = vert ? dx : dy
    const sign = screenSign()
    const d = main * sign
    const moveMain = vert ? y - state.lastY : x - state.lastX
    const moveD = moveMain * sign
    state.lastX = x
    state.lastY = y

    if (!swiping()) {
      if (Math.abs(main) < AXIS_LOCK_SLOP && Math.abs(cross) < AXIS_LOCK_SLOP) {
        return false
      }
      if (Math.abs(cross) > Math.abs(main) + AXIS_LOCK_BIAS) {
        // The cross axis is decisively winning. Only a cross-axis consumer at
        // the press origin (a native scroller or an axis-marked element) takes
        // the gesture permanently; otherwise the main axis can still claim it
        // once the drag straightens out.
        if (state.crossAxisTarget) {
          state.abandoned = true
        }
        return false
      }
      if (blocked()) {
        return false
      }
      if (state.scrollTarget) {
        if (canScrollInGestureDirection(state.scrollTarget, vert, moveMain, state.scrollRtl)) {
          // The scroller still has room in the move direction: yield this move
          // and re-arbitrate on the next one, so reaching the scroll edge hands
          // the rest of the gesture back to the drawer.
          return false
        }
        if (moveD <= 0) {
          // The scroller is at its edge but this move is away from the dismiss
          // direction: leave it to native overscroll instead of claiming the
          // gesture for a rubber-band the drawer should not own.
          return false
        }
      }
      state.lockD = d
      // The element may still be mid enter/snap transition: capture its live
      // translate so the drag continues from the visual position instead of
      // jumping to the resting transform. An unreadable transform falls back to
      // the resting position (baseline 0).
      if (swipeElement) {
        const translate = getElementTranslate(swipeElement)
        if (translate) {
          setBaseline((vert ? translate.y : translate.x) * sign - snapPointOffset())
        }
      }
      setSwiping(true)
    }

    // Reverse-cancel: track the deepest point of the current retreat. Receding
    // `REVERSE_CANCEL_THRESHOLD` below it cancels; recovering a full dismiss
    // threshold from the retreat re-arms the swipe. Skipped for snap points:
    // there the reverse direction expands toward a larger point, so a retreat
    // is a valid gesture, not a change of mind.
    if (resolvedSnapPoints().length === 0) {
      if ((moveD < 0 && d > state.cancelBaseD) || (moveD > 0 && d < state.cancelBaseD)) {
        state.cancelBaseD = d
      }
      const cancelD = d - state.cancelBaseD
      if (cancelD > dismissThreshold()) {
        state.cancelled = false
      } else if (state.lockD - cancelD >= REVERSE_CANCEL_THRESHOLD) {
        state.cancelled = true
      }
    }

    recordSample(state, main, timeStamp)
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
    swipeElement = content

    const ownerWindow = content.ownerDocument.defaultView
    const ownerDocument = content.ownerDocument
    blocked = () => containsOverlayContentAbove(content, ownerDocument.documentElement)

    // While a nested stack is mounted the popup's measured size is forced (the
    // stack pins it to the frontmost height), so measurements are skipped and
    // the last unforced size is kept as its own.
    function measureSize(): void {
      if (drawer.nested.openCount() === 0) {
        drawer.nested.setPopupHeight(content.offsetHeight)
        setPopupWidth(content.offsetWidth)
      }
    }
    // Kept off the ResizeObserver path: `getComputedStyle` forces style
    // resolution, and the observer fires per frame during size transitions.
    // `visualViewport.height` tracks on-screen-keyboard and chrome shrinkage
    // that `innerHeight` misses on mobile.
    function measureViewport(): void {
      setViewportHeight(ownerWindow?.visualViewport?.height ?? ownerWindow?.innerHeight ?? 0)
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
      if (drag || event.pointerType === 'touch' || !modal.open()) {
        return
      }
      if (event.button !== 0 || event.defaultPrevented) {
        return
      }
      if (blocked() || swipeIgnoreMatch(event.target, vertical(), false)) {
        return
      }
      if (event.target instanceof Element && event.target.closest(SWIPE_BODY_SELECTOR)) {
        return
      }
      // Pointer drags never arbitrate with scrolling: a press inside a
      // main-axis scrollable ancestor belongs to it, like the body region.
      const targets = findScrollableTargets(event.target, content, vertical())
      if (targets.scrollTarget) {
        return
      }

      clearContentSelection(content)
      const vert = vertical()
      const crossAxisMarker =
        event.target instanceof Element &&
        event.target.closest(axisSwipeIgnoreSelector(vert ? 'x' : 'y')) !== null
      drag = createDrag(
        event.clientX,
        event.clientY,
        event.timeStamp,
        null,
        targets.crossScrollable || crossAxisMarker,
        targets.scrollRtl,
      )

      const state = drag
      // Pointer drags capture on swipe start so clicks aren't retargeted beforehand.
      let captured = false
      let sawPrimaryButton = false
      function finish(released: boolean, x?: number, y?: number, timeStamp?: number): void {
        if (captured) {
          captured = false
          try {
            content.releasePointerCapture?.(event.pointerId)
          } catch {
            // Pointer capture is best-effort, matching the set path.
          }
        }
        endDrag(state, released, x, y, timeStamp)
      }
      state.docCleanup = attachEventListenerMap(ownerDocument, {
        pointermove: (moveEvent) => {
          if (moveEvent.pointerId !== event.pointerId) {
            return
          }
          const hasPrimaryButton = (moveEvent.buttons & 1) === 1
          if (hasPrimaryButton) {
            sawPrimaryButton = true
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
          if (moveEvent.buttons === 0 && sawPrimaryButton) {
            updateDrag(state, moveEvent.clientX, moveEvent.clientY, moveEvent.timeStamp)
            finish(true, moveEvent.clientX, moveEvent.clientY, moveEvent.timeStamp)
            return
          }
          // A descendant claiming the gesture for itself while the swipe is
          // still pending wins for the rest of the drag.
          if (!swiping() && moveEvent.defaultPrevented) {
            state.abandoned = true
            return
          }
          if (
            updateDrag(state, moveEvent.clientX, moveEvent.clientY, moveEvent.timeStamp) &&
            !captured
          ) {
            captured = true
            try {
              content.setPointerCapture?.(moveEvent.pointerId)
            } catch {
              // Environments without pointer capture (jsdom) still receive document events.
            }
          }
        },
        pointerup: (upEvent) => {
          if (upEvent.pointerId !== event.pointerId) {
            return
          }
          finish(true, upEvent.clientX, upEvent.clientY, upEvent.timeStamp)
        },
        pointercancel: () => {
          finish(false)
        },
      })
    }

    function onTouchStart(event: TouchEvent): void {
      if (drag || !modal.open() || event.touches.length !== 1 || event.defaultPrevented) {
        return
      }
      if (blocked() || swipeIgnoreMatch(event.target, vertical(), true)) {
        return
      }
      // Dragging a live selection's handles inside the popup is not a swipe.
      if (shouldIgnoreSwipeForTextSelection(content)) {
        return
      }
      const touch = event.touches[0]!
      const vert = vertical()
      const targets = findScrollableTargets(event.target, content, vert)
      const crossAxisMarker =
        event.target instanceof Element &&
        event.target.closest(axisSwipeIgnoreSelector(vert ? 'x' : 'y')) !== null
      drag = createDrag(
        touch.clientX,
        touch.clientY,
        event.timeStamp,
        targets.scrollTarget,
        targets.crossScrollable || crossAxisMarker,
        targets.scrollRtl,
      )
      drag.touchId = touch.identifier
    }

    function onTouchMove(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined || state.abandoned) {
        return
      }
      // A live selection inside the popup keeps owning the gesture.
      if (shouldIgnoreSwipeForTextSelection(content)) {
        return
      }
      if (!event.cancelable) {
        // The browser already committed this touch to native scrolling or
        // pinch. An unclaimed gesture cannot be taken back; a claimed one
        // keeps tracking so the popup still follows the finger.
        if (!swiping()) {
          state.abandoned = true
          return
        }
        const trackingTouch = touchById(event.touches, state.touchId)
        if (trackingTouch) {
          updateDrag(state, trackingTouch.clientX, trackingTouch.clientY, event.timeStamp)
        }
        return
      }
      // A descendant claiming the gesture for itself while the swipe is still
      // pending wins for the rest of the drag.
      if (!swiping() && event.defaultPrevented) {
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
      const claimed = updateDrag(state, touch.clientX, touch.clientY, event.timeStamp)
      // Claim gestures with no scrollable ancestor immediately: once the
      // browser commits a touch to native scrolling, every later move is
      // non-cancelable and the drag can no longer take it back.
      if (claimed || (!state.scrollTarget && !state.crossAxisTarget)) {
        event.preventDefault()
      }
    }

    function onTouchEnd(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined) {
        return
      }
      const touch = touchById(event.changedTouches, state.touchId)
      endDrag(
        state,
        !state.abandoned,
        touch?.clientX ?? state.lastX,
        touch?.clientY ?? state.lastY,
        event.timeStamp,
      )
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
    // Visual viewport changes (mobile chrome, on-screen keyboard) resize the
    // layout viewport for snap-point resolution without a window resize.
    const visualViewport = ownerWindow?.visualViewport
    if (visualViewport) {
      createEventListenerMap(visualViewport, {
        resize: measureViewport,
        scroll: measureViewport,
      })
    }
    // A nested stack pins the popup's measured size; once it fully unmounts,
    // re-measure so a height changed while pinned is picked up.
    createEffect(
      on(drawer.nested.openCount, (count) => {
        if (count === 0) {
          measureSize()
        }
      }),
    )
    createEventListenerMap(content, {
      pointerdown: onPointerDown,
      touchstart: onTouchStart,
    })
    // Touch continuation is tracked on the document: touch events dispatch to
    // the gesture's original target, which may leave the DOM mid-drag (list
    // virtualization, conditional content), silently stranding the gesture.
    createEventListenerMap(ownerDocument, {
      touchmove: [onTouchMove, { passive: false }],
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
      swipeElement = null
      // The root-level channel signals outlive this content; drop the measured
      // size so a remount reports 0 first and ancestors transition like on the
      // first open instead of snapping to a stale height.
      drawer.nested.setPopupHeight(0)
    })
  }

  return {
    swiping,
    movement,
    snapPointOffsetCss,
    progress,
    attach,
  }
}
