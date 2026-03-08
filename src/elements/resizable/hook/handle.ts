import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

import {
  RESIZABLE_HANDLE_TARGET_END,
  RESIZABLE_HANDLE_TARGET_HANDLE,
  RESIZABLE_HANDLE_TARGET_START,
  refreshResizableHandleIntersections,
  scheduleResizableHandleIntersectionsRefresh,
  registerResizableHandle,
  startResizableHandleDrag,
  updateResizableHandleIntersectionHoverState,
} from './manager'
import type {
  ResizableHandleIntersectionEdge,
  ResizableHandleIntersectionTarget,
  ResizableHandleRegistration,
} from './manager'
import type { ResizableOrientation } from './panel'

export interface ResizableHandleOptions {
  renderHandle?: boolean | JSX.Element
  disableHandle?: boolean
  intersection?: boolean
  onHandleDragStart?: (event: PointerEvent) => void
  onHandleDrag?: (event: CustomEvent) => void
  onHandleDragEnd?: (event: PointerEvent | TouchEvent | MouseEvent) => void
}

const HANDLE_STATE_HOVERED = 1 << 0
const HANDLE_STATE_FOCUSED = 1 << 1
const HANDLE_STATE_DRAGGING = 1 << 2
const HANDLE_STATE_CROSS_HOVERED = 1 << 3

const HANDLE_START_TARGET_ATTR = 'data-resizable-handle-start-target'
const HANDLE_END_TARGET_ATTR = 'data-resizable-handle-end-target'

export interface UseResizableHandleOptions {
  handleIndex: Accessor<number>
  orientation: Accessor<ResizableOrientation>
  options: Accessor<ResizableHandleOptions | undefined>
  onDrag: (handleIndex: number, deltaPx: number, altKey: boolean) => void
  onDragEnd: () => void
  onKeyDown: (handleIndex: number, event: KeyboardEvent, altKey: boolean) => void
}

export interface ResizableHandleBindings {
  setElement: (element: HTMLDivElement) => void
  startIntersectionVisible: Accessor<boolean>
  endIntersectionVisible: Accessor<boolean>
  cross: Accessor<boolean>
  dragging: Accessor<boolean>
  active: Accessor<boolean>
  onMouseEnter: (event: MouseEvent) => void
  onMouseLeave: (event: MouseEvent) => void
  onFocus: (event: FocusEvent) => void
  onBlur: (event: FocusEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
  onPointerDown: (event: PointerEvent) => void
  onIntersectionMouseEnter: (target: ResizableHandleIntersectionEdge) => void
  onIntersectionMouseLeave: (event: MouseEvent) => void
}

export function useResizableHandle(options: UseResizableHandleOptions): ResizableHandleBindings {
  const [element, setElement] = createSignal<HTMLDivElement>()
  const [interactionState, setInteractionState] = createSignal(0)
  const [startIntersection, setStartIntersection] =
    createSignal<ResizableHandleRegistration | null>(null)
  const [endIntersection, setEndIntersection] = createSignal<ResizableHandleRegistration | null>(
    null,
  )

  const mergedOptions = createMemo<ResizableHandleOptions>(() => ({
    intersection: true,
    ...options.options(),
  }))

  function setInteractionStateFlag(flag: number, enabled: boolean): void {
    setInteractionState((previous) => (enabled ? previous | flag : previous & ~flag))
  }

  const disabled = createMemo(() => mergedOptions().disableHandle === true)
  const cross = createMemo(() => startIntersection() !== null || endIntersection() !== null)
  const dragging = createMemo(() => (interactionState() & HANDLE_STATE_DRAGGING) !== 0)
  const active = createMemo(() => interactionState() !== 0)

  const registrationId = Symbol('resizable-handle')
  let registration: ResizableHandleRegistration | null = null

  createEffect(() => {
    const currentElement = element()
    if (!currentElement || disabled()) {
      return
    }

    registration = {
      id: registrationId,
      getElement: () => element(),
      getRootElement: () =>
        (element()?.closest('[data-resizable-root]') as HTMLDivElement | null) ?? undefined,
      getOrientation: options.orientation,
      getAltKeyMode: () => true,
      getStartIntersectionEnabled: () => mergedOptions().intersection !== false,
      getEndIntersectionEnabled: () => mergedOptions().intersection !== false,
      getStartIntersection: startIntersection,
      getEndIntersection: endIntersection,
      setStartIntersection,
      setEndIntersection,
      setDragging: (nextDragging) => setInteractionStateFlag(HANDLE_STATE_DRAGGING, nextDragging),
      setCrossHovered: (nextHovered) =>
        setInteractionStateFlag(HANDLE_STATE_CROSS_HOVERED, nextHovered),
      onDrag: (deltaPx, altKey) => {
        const dragEvent = new CustomEvent('drag', { cancelable: true })
        mergedOptions().onHandleDrag?.(dragEvent)

        if (dragEvent.defaultPrevented) {
          return
        }

        options.onDrag(options.handleIndex(), deltaPx, altKey)
      },
      onDragEnd: (event) => {
        options.onDragEnd()
        mergedOptions().onHandleDragEnd?.(event)
      },
    }

    const unregister = registerResizableHandle(registration)
    onCleanup(() => {
      unregister()
      registration = null
    })
  })

  createEffect(() => {
    void [options.orientation(), mergedOptions().intersection]
    scheduleResizableHandleIntersectionsRefresh()
  })

  function onMouseEnter(): void {
    setInteractionStateFlag(HANDLE_STATE_HOVERED, true)
    scheduleResizableHandleIntersectionsRefresh()
  }

  function onMouseLeave(): void {
    setInteractionStateFlag(HANDLE_STATE_HOVERED, false)
  }

  function onFocus(): void {
    setInteractionStateFlag(HANDLE_STATE_FOCUSED, true)
  }

  function onBlur(): void {
    setInteractionStateFlag(HANDLE_STATE_FOCUSED, false)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (dragging()) {
      return
    }

    options.onKeyDown(options.handleIndex(), event, event.altKey)
  }

  function onPointerDown(event: PointerEvent): void {
    if (disabled() || !registration) {
      return
    }

    mergedOptions().onHandleDragStart?.(event)
    if (event.defaultPrevented) {
      return
    }

    const target = event.target as HTMLElement | null
    if (typeof target?.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId)
    }

    let targetType: ResizableHandleIntersectionTarget = RESIZABLE_HANDLE_TARGET_HANDLE
    if (target?.hasAttribute(HANDLE_START_TARGET_ATTR)) {
      targetType = RESIZABLE_HANDLE_TARGET_START
    } else if (target?.hasAttribute(HANDLE_END_TARGET_ATTR)) {
      targetType = RESIZABLE_HANDLE_TARGET_END
    }

    refreshResizableHandleIntersections()
    startResizableHandleDrag(registration, event, targetType)
  }

  function onIntersectionMouseEnter(target: ResizableHandleIntersectionEdge): void {
    if (!registration) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_HOVERED, true)
    updateResizableHandleIntersectionHoverState(registration, target, true)
  }

  function onIntersectionMouseLeave(event: MouseEvent): void {
    if (registration) {
      const target = event.currentTarget as HTMLElement | null
      const hoverTarget = target?.hasAttribute(HANDLE_START_TARGET_ATTR)
        ? RESIZABLE_HANDLE_TARGET_START
        : target?.hasAttribute(HANDLE_END_TARGET_ATTR)
          ? RESIZABLE_HANDLE_TARGET_END
          : null

      if (hoverTarget !== null) {
        updateResizableHandleIntersectionHoverState(registration, hoverTarget, false)
      }
    }

    const currentElement = element()
    const nextTarget = event.relatedTarget as Node | null

    if (currentElement?.contains(nextTarget)) {
      setInteractionStateFlag(HANDLE_STATE_HOVERED, true)
      return
    }

    setInteractionStateFlag(HANDLE_STATE_HOVERED, false)
  }

  return {
    setElement,
    startIntersectionVisible: () => startIntersection() !== null,
    endIntersectionVisible: () => endIntersection() !== null,
    cross,
    dragging,
    active,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
    onPointerDown,
    onIntersectionMouseEnter,
    onIntersectionMouseLeave,
  }
}
