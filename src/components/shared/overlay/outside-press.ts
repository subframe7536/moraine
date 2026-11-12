import { isNode } from './dom'

export interface OutsidePressOptions {
  isInside: (target: Node) => boolean
  isEnabled: () => boolean
  onPress: (event: PointerEvent) => void
}

interface PendingPointer {
  event: PointerEvent
  startX: number
  startY: number
  timeoutId: ReturnType<typeof setTimeout>
  valid: boolean
}

export interface OutsidePressHandlers {
  dispose: () => void
  pointerdown: (event: PointerEvent) => void
  pointermove: (event: PointerEvent) => void
  pointerup: (event: PointerEvent) => void
  pointercancel: (event: PointerEvent) => void
}

/** Delays coarse-pointer dismissal until a completed tap so scrolling cannot close an overlay. */
export function createOutsidePressHandlers(options: OutsidePressOptions): OutsidePressHandlers {
  const pendingPointers = new Map<number, PendingPointer>()
  let disposed = false

  const clearPointer = (event: PointerEvent): PendingPointer | undefined => {
    const pending = pendingPointers.get(event.pointerId)
    pendingPointers.delete(event.pointerId)
    if (pending) {
      clearTimeout(pending.timeoutId)
    }
    return pending
  }

  return {
    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      for (const pending of pendingPointers.values()) {
        clearTimeout(pending.timeoutId)
      }
      pendingPointers.clear()
    },
    pointerdown: (event) => {
      if (disposed) {
        return
      }

      const target = event.target
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        !isNode(target) ||
        options.isInside(target) ||
        !options.isEnabled()
      ) {
        return
      }

      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        options.onPress(event)
        return
      }

      clearPointer(event)
      let pending: PendingPointer
      const timeoutId = setTimeout(() => {
        if (pendingPointers.get(event.pointerId) === pending) {
          pendingPointers.delete(event.pointerId)
        }
      }, 1000)
      pending = {
        event,
        startX: event.clientX,
        startY: event.clientY,
        timeoutId,
        valid: !event.defaultPrevented,
      }
      pendingPointers.set(event.pointerId, pending)
      if (pendingPointers.size > 1) {
        for (const pending of pendingPointers.values()) {
          pending.valid = false
        }
      }
    },
    pointermove: (event) => {
      if (disposed) {
        return
      }

      const pending = pendingPointers.get(event.pointerId)
      if (
        pending &&
        (Math.abs(event.clientX - pending.startX) > 5 ||
          Math.abs(event.clientY - pending.startY) > 5)
      ) {
        pending.valid = false
      }
    },
    pointerup: (event) => {
      if (disposed) {
        return
      }

      const pending = clearPointer(event)
      if (pending?.valid && pendingPointers.size === 0 && options.isEnabled()) {
        options.onPress(pending.event)
      }
    },
    pointercancel: (event) => {
      if (disposed) {
        return
      }

      clearPointer(event)
    },
  }
}
