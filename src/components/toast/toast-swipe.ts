import type { Accessor } from 'solid-js'
import { createSignal } from 'solid-js'

export const SWIPE_THRESHOLD = 45
export const SWIPE_VELOCITY = 0.11
export const SWIPE_MIN_DISTANCE = 12
export const TOAST_SWIPE_EXIT_MS = 200

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export function isAwaySwipe(
  axis: 'x' | 'y',
  x: number,
  y: number,
  align: 'start' | 'center' | 'end',
  isTop: boolean,
): boolean {
  if (axis === 'x') {
    if (align === 'start') {
      return x < 0
    }
    if (align === 'end') {
      return x > 0
    }
    return true
  }
  return isTop ? y < 0 : y > 0
}

export interface CreateToastSwipeOptions {
  element: () => HTMLElement | null | undefined
  align: Accessor<'start' | 'center' | 'end'>
  isTop: Accessor<boolean>
  isLoading: Accessor<boolean>
  onDismiss: () => void
}

export function createToastSwipe(options: CreateToastSwipeOptions) {
  const [swiping, setSwiping] = createSignal(false)
  const [swipeOffset, setSwipeOffset] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 })
  const [swipeOutDirection, setSwipeOutDirection] = createSignal<SwipeDirection | null>(null)
  const swipeOut = () => swipeOutDirection() !== null

  let pointerStart: { x: number; y: number } | null = null
  let dragStartTime = 0
  let dragAxis: 'x' | 'y' | null = null

  function handlePointerDown(event: PointerEvent) {
    if (event.button === 2 || options.isLoading()) {
      return
    }
    const targetEl = event.target as HTMLElement | null
    if (targetEl?.closest('button, a, input, textarea, select, [data-swipe-ignore]')) {
      return
    }
    dragStartTime = Date.now()
    const el = options.element()
    el?.setPointerCapture?.(event.pointerId)
    setSwiping(true)
    pointerStart = { x: event.clientX, y: event.clientY }
    dragAxis = null
  }

  function handlePointerMove(event: PointerEvent) {
    if (!pointerStart) {
      return
    }
    const el = options.element()
    if (el?.ownerDocument.getSelection()?.toString().length) {
      return
    }
    const xDelta = event.clientX - pointerStart.x
    const yDelta = event.clientY - pointerStart.y
    if (!dragAxis && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      dragAxis = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }
    const getDampening = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20)
    if (dragAxis === 'x') {
      const align = options.align()
      let movement = xDelta
      if (align === 'end' && xDelta < 0) {
        movement = xDelta * getDampening(xDelta)
      } else if (align === 'start' && xDelta > 0) {
        movement = xDelta * getDampening(xDelta)
      }
      setSwipeOffset({ x: movement, y: 0 })
    } else if (dragAxis === 'y') {
      let movement = yDelta
      if (options.isTop() && yDelta > 0) {
        movement = yDelta * getDampening(yDelta)
      } else if (!options.isTop() && yDelta < 0) {
        movement = yDelta * getDampening(yDelta)
      }
      setSwipeOffset({ x: 0, y: movement })
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (!pointerStart || swipeOut()) {
      return
    }
    const el = options.element()
    if (el?.hasPointerCapture?.(event.pointerId)) {
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        // The pointer may already have been released.
      }
    }
    const timeTaken = Math.max(Date.now() - dragStartTime, 1)
    const offset = swipeOffset()
    const movedX = offset.x
    const movedY = offset.y
    const primaryDistance = dragAxis === 'y' ? Math.abs(movedY) : Math.abs(movedX)
    const velocity = primaryDistance / timeTaken
    const align = options.align()
    const allowed =
      dragAxis !== null && isAwaySwipe(dragAxis, movedX, movedY, align, options.isTop())
    const distanceOk = primaryDistance >= SWIPE_THRESHOLD
    const velocityOk = velocity > SWIPE_VELOCITY && primaryDistance >= SWIPE_MIN_DISTANCE
    pointerStart = null
    if (allowed && (distanceOk || velocityOk)) {
      if (dragAxis === 'x') {
        setSwipeOutDirection(movedX > 0 ? 'right' : 'left')
      } else {
        setSwipeOutDirection(movedY > 0 ? 'down' : 'up')
      }
      options.onDismiss()
      return
    }
    setSwiping(false)
    dragAxis = null
    setSwipeOffset({ x: 0, y: 0 })
  }

  return {
    swiping,
    swipeOffset,
    swipeOutDirection,
    swipeOut,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
