import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup } from 'solid-js'

import {
  attachEventListenerMap,
  createEventListener,
  createEventListenerMap,
} from '../../shared/event-listener'

import type { ResolvedDrawerSnapPoint } from './drawer-snap-points'
import {
  clampSnapValue,
  closestSnapPointIndex,
  getSnapPointSwipeMovement,
  resolveSnapPointValue,
  resolveSnapPoints,
} from './drawer-snap-points'
import type { DrawerT } from './drawer.types'

export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right'

const AXIS_LOCK_SLOP = 6
const MIN_SWIPE_THRESHOLD = 10
const FAST_SWIPE_VELOCITY = 0.5
const SNAP_VELOCITY_THRESHOLD = 0.5
const SNAP_VELOCITY_MULTIPLIER = 300
const MAX_SNAP_VELOCITY = 4
const VELOCITY_SAMPLE_WINDOW_MS = 100

const SWIPE_IGNORE_SELECTOR =
  'button, a, input, textarea, select, [contenteditable], [role="slider"], [data-swipe-ignore]'
const SWIPE_BODY_SELECTOR = '[data-slot="drawer-body"]'

export function swipeDirectionForSide(
  side: 'top' | 'right' | 'bottom' | 'left',
): DrawerSwipeDirection {
  switch (side) {
    case 'top':
      return 'up'
    case 'left':
      return 'left'
    case 'right':
      return 'right'
    default:
      return 'down'
  }
}

function isVertical(direction: DrawerSwipeDirection): boolean {
  return direction === 'down' || direction === 'up'
}

/** Sign that maps dismiss-direction displacement onto screen coordinates (+down/+right). */
function screenSign(direction: DrawerSwipeDirection): 1 | -1 {
  return direction === 'down' || direction === 'right' ? 1 : -1
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
): boolean {
  if (vertical) {
    if (screenDelta > 0) {
      return scroller.scrollTop > 0
    }
    return scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 1
  }
  if (screenDelta > 0) {
    return scroller.scrollLeft > 0
  }
  return scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 1
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

interface DragState {
  startX: number
  startY: number
  startTime: number
  pointerId?: number
  touchId?: number
  /** Pointer drags capture on swipe start so clicks aren't retargeted beforehand. */
  captureTarget?: HTMLElement
  scrollTarget: HTMLElement | null
  swiping: boolean
  abandoned: boolean
  samples: Array<{ time: number; value: number }>
  docCleanup?: VoidFunction
}

export interface DrawerSwipeOptions {
  open: Accessor<boolean>
  direction: Accessor<DrawerSwipeDirection>
  close: () => void
  snapPoints: Accessor<readonly DrawerT.SnapPoint[] | undefined>
  snapPoint: Accessor<DrawerT.SnapPoint | null>
  setSnapPoint: (point: DrawerT.SnapPoint | null) => void
  snapToSequentialPoints: Accessor<boolean>
}

export interface DrawerSwipeController {
  /** Whether a swipe gesture is currently dragging the content. */
  swiping: Accessor<boolean>
  /** Current swipe offset in screen coordinates (+down/+right), damped past the open edge. */
  movement: Accessor<number>
  /** Active snap point offset in px (0 without snap points). */
  snapPointOffset: Accessor<number>
  /** Dismissal progress in [0, 1] used for overlay opacity. */
  progress: Accessor<number>
  /** Binds the gesture to the content element for the element's lifetime. */
  attach: (element: HTMLElement) => void
}

/**
 * Swipe-to-dismiss and snap-point gesture controller for Drawer.Content.
 * Bind it to the content element in the render owner that mounts it.
 */
export function createDrawerSwipe(options: DrawerSwipeOptions): DrawerSwipeController {
  const [swiping, setSwiping] = createSignal(false)
  const [movement, setMovement] = createSignal(0)
  const [displacement, setDisplacement] = createSignal(0)
  const [popupHeight, setPopupHeight] = createSignal(0)
  const [popupWidth, setPopupWidth] = createSignal(0)
  const [viewportHeight, setViewportHeight] = createSignal(0)
  const [rootFontSize, setRootFontSize] = createSignal(16)

  let drag: DragState | null = null

  const vertical = () => isVertical(options.direction())

  const resolvedSnapPoints = createMemo(() => {
    if (!vertical()) {
      return []
    }
    return resolveSnapPoints(options.snapPoints(), popupHeight(), viewportHeight(), rootFontSize())
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

    const maxHeight = Math.min(popupHeight(), viewportHeight())
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

  const hasSnapPoints = () => resolvedSnapPoints().length > 0

  const popupSize = () => (vertical() ? popupHeight() : popupWidth())

  const progress = createMemo(() => {
    const size = popupSize()
    if (size <= 0) {
      return 0
    }
    return clampSnapValue((snapPointOffset() + displacement()) / size, 0, 1)
  })

  function axisDelta(state: DragState, x: number, y: number): { main: number; cross: number } {
    const dx = x - state.startX
    const dy = y - state.startY
    return vertical() ? { main: dy, cross: dx } : { main: dx, cross: dy }
  }

  function applyMovement(rawD: number): void {
    const damped = getSnapPointSwipeMovement(snapPointOffset(), rawD)
    setDisplacement(rawD)
    setMovement(damped * screenSign(options.direction()))
  }

  function resetDrag(): void {
    setDisplacement(0)
    setMovement(0)
    setSwiping(false)
  }

  function velocity(state: DragState): number {
    const now = performance.now()
    const from = now - VELOCITY_SAMPLE_WINDOW_MS
    let first = state.samples[0]
    for (const sample of state.samples) {
      if (sample.time >= from) {
        first = sample
        break
      }
    }
    const last = state.samples[state.samples.length - 1]
    if (!first || !last || last === first || last.time <= first.time) {
      return 0
    }
    return ((last.value - first.value) / (last.time - first.time)) * screenSign(options.direction())
  }

  function gestureVelocity(state: DragState, d: number): number {
    const elapsed = performance.now() - state.startTime
    return elapsed > 0 ? (d / elapsed) * screenSign(options.direction()) : 0
  }

  function recordSample(state: DragState, x: number, y: number): number {
    const { main } = axisDelta(state, x, y)
    const d = main * screenSign(options.direction())
    state.samples.push({ time: performance.now(), value: main })
    return d
  }

  function settleDrag(state: DragState, released: boolean): void {
    if (!released) {
      resetDrag()
      return
    }

    const last = state.samples[state.samples.length - 1]
    const d = last ? last.value * screenSign(options.direction()) : 0
    const recent = velocity(state)
    const overall = gestureVelocity(state, last?.value ?? 0)
    const size = popupSize()

    if (!hasSnapPoints()) {
      const shouldClose = d > 0 && (recent >= FAST_SWIPE_VELOCITY || d > Math.max(size * 0.5, 10))
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
    let directionalVelocity = recent
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

    if (directionalVelocity >= FAST_SWIPE_VELOCITY && dragDelta > 0) {
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

  function endDrag(state: DragState, released: boolean): void {
    state.docCleanup?.()
    if (drag === state) {
      drag = null
    }
    if (state.abandoned || !state.swiping) {
      resetDrag()
      return
    }
    setSwiping(false)
    settleDrag(state, released)
  }

  function updateDrag(state: DragState, x: number, y: number): boolean {
    // Returns true once the gesture owns the drag (caller may preventDefault).
    if (state.abandoned) {
      return false
    }
    const { main, cross } = axisDelta(state, x, y)
    if (!state.swiping) {
      if (Math.abs(main) < AXIS_LOCK_SLOP && Math.abs(cross) < AXIS_LOCK_SLOP) {
        return false
      }
      if (Math.abs(cross) > Math.abs(main)) {
        state.abandoned = true
        return false
      }
      if (state.scrollTarget && canScrollInGestureDirection(state.scrollTarget, vertical(), main)) {
        state.abandoned = true
        return false
      }
      state.swiping = true
      setSwiping(true)
      if (state.pointerId !== undefined && state.captureTarget) {
        try {
          state.captureTarget.setPointerCapture?.(state.pointerId)
        } catch {
          // Environments without pointer capture (jsdom) still receive document events.
        }
      }
    }
    recordSample(state, x, y)
    applyMovement(main * screenSign(options.direction()))
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

    function measure(): void {
      setPopupHeight(content.offsetHeight)
      setPopupWidth(content.offsetWidth)
      setViewportHeight(ownerWindow?.innerHeight ?? 0)
      const fontSize = Number.parseFloat(
        ownerWindow?.getComputedStyle(ownerDocument.documentElement).fontSize ?? '',
      )
      if (Number.isFinite(fontSize)) {
        setRootFontSize(fontSize)
      }
    }
    measure()

    function onPointerDown(event: PointerEvent): void {
      if (event.pointerType === 'touch' || !options.open()) {
        return
      }
      if (event.button !== 0) {
        return
      }
      if (swipeIgnoreMatch(event.target, vertical(), false)) {
        return
      }
      if (event.target instanceof Element && event.target.closest(SWIPE_BODY_SELECTOR)) {
        return
      }

      clearContentSelection(content)
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now(),
        pointerId: event.pointerId,
        captureTarget: content,
        scrollTarget: null,
        swiping: false,
        abandoned: false,
        samples: [],
      }

      const state = drag
      state.docCleanup = attachEventListenerMap(ownerDocument, {
        pointermove: (moveEvent) => {
          if (moveEvent.pointerId !== state.pointerId) {
            return
          }
          updateDrag(state, moveEvent.clientX, moveEvent.clientY)
        },
        pointerup: (upEvent) => {
          if (upEvent.pointerId !== state.pointerId) {
            return
          }
          recordSample(state, upEvent.clientX, upEvent.clientY)
          endDrag(state, true)
        },
        pointercancel: () => {
          endDrag(state, false)
        },
      })
    }

    function onTouchStart(event: TouchEvent): void {
      if (!options.open() || event.touches.length !== 1) {
        return
      }
      if (swipeIgnoreMatch(event.target, vertical(), true)) {
        return
      }
      const touch = event.touches[0]!
      drag = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        touchId: touch.identifier,
        scrollTarget: findScrollableAncestor(event.target, content, vertical()),
        swiping: false,
        abandoned: false,
        samples: [],
      }
    }

    function onTouchMove(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined || state.abandoned) {
        return
      }
      const touch = Array.from(event.touches).find((item) => item.identifier === state.touchId)
      if (!touch) {
        return
      }
      if (updateDrag(state, touch.clientX, touch.clientY)) {
        event.preventDefault()
      }
    }

    function onTouchEnd(event: TouchEvent): void {
      const state = drag
      if (!state || state.touchId === undefined) {
        return
      }
      const touch = Array.from(event.changedTouches).find(
        (item) => item.identifier === state.touchId,
      )
      if (touch) {
        recordSample(state, touch.clientX, touch.clientY)
      }
      endDrag(state, !state.abandoned)
    }

    function onTouchCancel(): void {
      const state = drag
      if (!state || state.touchId === undefined) {
        return
      }
      endDrag(state, false)
    }

    createEventListener(ownerWindow, 'resize', measure)
    createEventListener(content, 'pointerdown', onPointerDown)
    createEventListener(content, 'touchstart', onTouchStart)
    createEventListener(content, 'touchmove', onTouchMove, { passive: false })
    createEventListenerMap(content, {
      touchend: onTouchEnd,
      touchcancel: onTouchCancel,
    })

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure)
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
    snapPointOffset,
    progress,
    attach,
  }
}
