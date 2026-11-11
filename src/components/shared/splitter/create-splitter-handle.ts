import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'

import {
  SPLITTER_END_TARGET_ATTRIBUTE,
  SPLITTER_ROOT_SELECTOR,
  SPLITTER_START_TARGET_ATTRIBUTE,
  SPLITTER_TARGET_SELECTOR,
  refreshSplitterIntersections,
  registerSplitterHandle,
  scheduleSplitterIntersectionsRefresh,
  startSplitterDrag,
  updateSplitterIntersectionHover,
} from './manager'
import type {
  SplitterHandleRegistration,
  SplitterIntersectionEdge,
  SplitterIntersectionTarget,
  SplitterOrientation,
} from './manager'

const START_TARGET_ATTR = `data-${SPLITTER_START_TARGET_ATTRIBUTE}`
const END_TARGET_ATTR = `data-${SPLITTER_END_TARGET_ATTRIBUTE}`

export interface CreateSplitterHandleOptions {
  orientation: Accessor<SplitterOrientation>
  disabled: Accessor<boolean | undefined>
  intersection: Accessor<boolean | undefined>
  onDrag: (deltaPx: number, altKey: boolean) => void
  onDragEnd: () => void
  onKeyDown: (event: KeyboardEvent) => void
}

export interface SplitterHandleBindings {
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
  onIntersectionMouseEnter: (edge: SplitterIntersectionEdge) => void
  onIntersectionMouseLeave: (event: MouseEvent) => void
}

export function createSplitterHandle(options: CreateSplitterHandleOptions): SplitterHandleBindings {
  const [element, setElement] = createSignal<HTMLDivElement>()
  const [hovered, setHovered] = createSignal(false)
  const [focused, setFocused] = createSignal(false)
  const [dragging, setDragging] = createSignal(false)
  const [crossHovered, setCrossHovered] = createSignal(false)
  const [startIntersection, setStartIntersection] = createSignal<SplitterHandleRegistration | null>(
    null,
  )
  const [endIntersection, setEndIntersection] = createSignal<SplitterHandleRegistration | null>(
    null,
  )

  const disabled = createMemo(() => options.disabled() === true)
  const active = createMemo(() => hovered() || focused() || dragging() || crossHovered())

  const registrationId = Symbol('splitter-handle')
  let registration: SplitterHandleRegistration | null = null

  createEffect(
    on(disabled, (isDisabled) => {
      if (isDisabled) {
        setHovered(false)
        setFocused(false)
        setDragging(false)
        setCrossHovered(false)
        setStartIntersection(null)
        setEndIntersection(null)
      }
    }),
  )

  createEffect(
    on([element, disabled], ([currentElement, isDisabled]) => {
      if (!currentElement || isDisabled) {
        return
      }

      registration = {
        id: registrationId,
        getElement: () => element(),
        getRootElement: () =>
          (element()?.closest(SPLITTER_ROOT_SELECTOR) as HTMLDivElement | null) ?? undefined,
        getOrientation: options.orientation,
        getStartIntersectionEnabled: () => options.intersection() === true,
        getEndIntersectionEnabled: () => options.intersection() === true,
        getStartIntersection: startIntersection,
        getEndIntersection: endIntersection,
        setStartIntersection,
        setEndIntersection,
        setDragging,
        setCrossHovered,
        onDrag: options.onDrag,
        onDragEnd: () => {
          options.onDragEnd()
        },
      }

      const unregister = registerSplitterHandle(registration)
      onCleanup(() => {
        unregister()
        registration = null
      })
    }),
  )

  createEffect(
    on([options.orientation, options.intersection], () => {
      scheduleSplitterIntersectionsRefresh()
    }),
  )

  function onMouseEnter(): void {
    if (disabled()) {
      return
    }

    setHovered(true)
    scheduleSplitterIntersectionsRefresh()
  }

  function onMouseLeave(): void {
    if (disabled()) {
      return
    }

    setHovered(false)
  }

  function onFocus(): void {
    if (disabled()) {
      return
    }

    setFocused(true)
  }

  function onBlur(): void {
    if (disabled()) {
      return
    }

    setFocused(false)
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (disabled() || dragging()) {
      return
    }

    options.onKeyDown(event)
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
    const targetElement = target?.closest<HTMLElement>(SPLITTER_TARGET_SELECTOR)
    let targetType: SplitterIntersectionTarget = 'handle'
    if (targetElement?.hasAttribute(START_TARGET_ATTR)) {
      targetType = 'start'
    } else if (targetElement?.hasAttribute(END_TARGET_ATTR)) {
      targetType = 'end'
    }

    refreshSplitterIntersections()
    startSplitterDrag(registration, event, targetType, currentTarget)
  }

  function onIntersectionMouseEnter(edge: SplitterIntersectionEdge): void {
    if (disabled() || !registration) {
      return
    }

    setHovered(true)
    updateSplitterIntersectionHover(registration, edge, true)
  }

  function onIntersectionMouseLeave(event: MouseEvent): void {
    if (disabled()) {
      return
    }

    if (registration) {
      const target = event.currentTarget as HTMLElement | null
      const hoverEdge = target?.hasAttribute(START_TARGET_ATTR)
        ? 'start'
        : target?.hasAttribute(END_TARGET_ATTR)
          ? 'end'
          : null

      if (hoverEdge !== null) {
        updateSplitterIntersectionHover(registration, hoverEdge, false)
      }
    }

    const currentElement = element()
    const nextTarget = event.relatedTarget as Node | null

    if (currentElement?.contains(nextTarget)) {
      setHovered(true)
      return
    }

    setHovered(false)
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
