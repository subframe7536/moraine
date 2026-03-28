import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'

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
import type { ResizableOrientation } from './types'

const HANDLE_STATE_HOVERED = 1 << 0
const HANDLE_STATE_FOCUSED = 1 << 1
const HANDLE_STATE_DRAGGING = 1 << 2
const HANDLE_STATE_CROSS_HOVERED = 1 << 3

const HANDLE_START_TARGET_ATTR = 'data-resizable-handle-start-target'
const HANDLE_END_TARGET_ATTR = 'data-resizable-handle-end-target'

export interface ResizableHandleOptions {
  disable?: boolean
  intersection?: boolean
}

export interface UseResizableHandleOptions {
  handleIndex: Accessor<number>
  orientation: Accessor<ResizableOrientation>
  disable: Accessor<boolean | undefined>
  intersection: Accessor<boolean | undefined>
  onDrag: (handleIndex: number, deltaPx: number, altKey: boolean) => void
  onDragEnd: () => void
  onKeyDown: (handleIndex: number, event: KeyboardEvent, altKey: boolean) => void
}

export interface ResizableHandleBindings {
  setElement: (element: HTMLDivElement) => void
  startIntersectionVisible: Accessor<boolean>
  endIntersectionVisible: Accessor<boolean>
  crossHovered: Accessor<boolean>
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

  function setInteractionStateFlag(flag: number, enabled: boolean): void {
    setInteractionState((previous) => (enabled ? previous | flag : previous & ~flag))
  }

  const disabled = createMemo(() => options.disable() === true)
  const crossHovered = createMemo(() => (interactionState() & HANDLE_STATE_CROSS_HOVERED) !== 0)
  const dragging = createMemo(() => (interactionState() & HANDLE_STATE_DRAGGING) !== 0)
  const active = createMemo(() => interactionState() !== 0)

  const registrationId = Symbol('resizable-handle')
  let registration: ResizableHandleRegistration | null = null

  createEffect(
    on(disabled, (isDisabled) => {
      if (isDisabled) {
        setInteractionState(0)
        setStartIntersection(null)
        setEndIntersection(null)
      }
    }),
  )

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
      getStartIntersectionEnabled: () => options.intersection() !== false,
      getEndIntersectionEnabled: () => options.intersection() !== false,
      getStartIntersection: startIntersection,
      getEndIntersection: endIntersection,
      setStartIntersection,
      setEndIntersection,
      setDragging: (nextDragging) => setInteractionStateFlag(HANDLE_STATE_DRAGGING, nextDragging),
      setCrossHovered: (nextHovered) =>
        setInteractionStateFlag(HANDLE_STATE_CROSS_HOVERED, nextHovered),
      onDrag: (deltaPx, altKey) => options.onDrag(options.handleIndex(), deltaPx, altKey),
      onDragEnd: () => {
        options.onDragEnd()
      },
    }

    const unregister = registerResizableHandle(registration)
    onCleanup(() => {
      unregister()
      registration = null
    })
  })

  createEffect(() => {
    void [options.orientation(), options.intersection()]
    scheduleResizableHandleIntersectionsRefresh()
  })

  function onMouseEnter(): void {
    if (disabled()) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_HOVERED, true)
    scheduleResizableHandleIntersectionsRefresh()
  }

  function onMouseLeave(): void {
    if (disabled()) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_HOVERED, false)
  }

  function onFocus(): void {
    if (disabled()) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_FOCUSED, true)
  }

  function onBlur(): void {
    if (disabled()) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_FOCUSED, false)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (disabled() || dragging()) {
      return
    }

    options.onKeyDown(options.handleIndex(), event, event.altKey)
  }

  function onPointerDown(event: PointerEvent): void {
    if (disabled() || !registration) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    const currentTarget = event.currentTarget as HTMLElement | null
    if (typeof currentTarget?.setPointerCapture === 'function') {
      currentTarget.setPointerCapture(event.pointerId)
    }

    const target = event.target as HTMLElement | null
    const targetElement = target?.closest<HTMLElement>(
      `[${HANDLE_START_TARGET_ATTR}], [${HANDLE_END_TARGET_ATTR}]`,
    )
    let targetType: ResizableHandleIntersectionTarget = RESIZABLE_HANDLE_TARGET_HANDLE
    if (targetElement?.hasAttribute(HANDLE_START_TARGET_ATTR)) {
      targetType = RESIZABLE_HANDLE_TARGET_START
    } else if (targetElement?.hasAttribute(HANDLE_END_TARGET_ATTR)) {
      targetType = RESIZABLE_HANDLE_TARGET_END
    }

    refreshResizableHandleIntersections()
    startResizableHandleDrag(registration, event, targetType)
  }

  function onIntersectionMouseEnter(target: ResizableHandleIntersectionEdge): void {
    if (disabled() || !registration) {
      return
    }

    setInteractionStateFlag(HANDLE_STATE_HOVERED, true)
    updateResizableHandleIntersectionHoverState(registration, target, true)
  }

  function onIntersectionMouseLeave(event: MouseEvent): void {
    if (disabled()) {
      return
    }

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
    startIntersectionVisible: () => !disabled() && startIntersection() !== null,
    endIntersectionVisible: () => !disabled() && endIntersection() !== null,
    crossHovered,
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
