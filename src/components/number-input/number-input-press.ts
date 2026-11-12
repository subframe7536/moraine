import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

import { callHandler } from '../../shared/utils'

export type ControlKind = 'increment' | 'decrement'

export interface RepeatConfig {
  delay: number
  interval: number
  throttle: number
  pointerTypes: string
}

export interface CreateNumberInputPressOptions {
  isInteractive: (kind: ControlKind) => boolean
  onStep: (kind: ControlKind) => void
  getUserOnClick: (
    kind: ControlKind,
  ) => JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined
  focusInput: () => void
  getDocument: () => Document | undefined
  repeat: () => RepeatConfig | null
}

interface SavedSelection {
  body: HTMLElement
  userSelect: string
  webkitUserSelect: string
}

interface PressState {
  activePointerId: number | null
  delayTimer?: ReturnType<typeof setTimeout>
  repeatTimer?: ReturnType<typeof setInterval>
  repeatStarted: boolean
  lastTriggeredAt: number
  lastPointerType?: string
  targetEl: HTMLButtonElement | null
}

function createPressState(): PressState {
  return {
    activePointerId: null,
    delayTimer: undefined,
    repeatTimer: undefined,
    repeatStarted: false,
    lastTriggeredAt: 0,
    lastPointerType: undefined,
    targetEl: null,
  }
}

export function createNumberInputPress(options: CreateNumberInputPressOptions) {
  const [pressedControls, setPressedControls] = createSignal<Record<ControlKind, boolean>>({
    increment: false,
    decrement: false,
  })

  let lockCount = 0
  let savedSelection: SavedSelection | null = null

  const states: Record<ControlKind, PressState> = {
    increment: createPressState(),
    decrement: createPressState(),
  }

  function lockSelection(): void {
    const ownerDocument = options.getDocument()
    if (!ownerDocument) {
      return
    }

    if (lockCount === 0) {
      savedSelection = {
        body: ownerDocument.body,
        userSelect: ownerDocument.body.style.getPropertyValue('user-select'),
        webkitUserSelect: ownerDocument.body.style.getPropertyValue('-webkit-user-select'),
      }
      ownerDocument.body.style.setProperty('user-select', 'none')
      ownerDocument.body.style.setProperty('-webkit-user-select', 'none')
    }

    lockCount += 1
  }

  function unlockSelection(): void {
    if (lockCount === 0) {
      return
    }

    lockCount -= 1

    if (lockCount === 0 && savedSelection) {
      savedSelection.body.style.setProperty('user-select', savedSelection.userSelect)
      savedSelection.body.style.setProperty('-webkit-user-select', savedSelection.webkitUserSelect)
      savedSelection = null
    }
  }

  function clearRepeatTimers(state: PressState): void {
    if (state.delayTimer !== undefined) {
      clearTimeout(state.delayTimer)
      state.delayTimer = undefined
    }

    if (state.repeatTimer !== undefined) {
      clearInterval(state.repeatTimer)
      state.repeatTimer = undefined
    }
  }

  function finishPress(kind: ControlKind): void {
    const state = states[kind]
    if (state.activePointerId === null) {
      return
    }

    clearRepeatTimers(state)
    state.activePointerId = null
    state.targetEl = null
    setPressedControls((prev) => (prev[kind] ? { ...prev, [kind]: false } : prev))
    unlockSelection()
  }

  // Cancel hold immediately when callback or reactive state makes control non-interactive.
  createEffect(
    on(
      [() => options.isInteractive('increment'), () => options.isInteractive('decrement')],
      ([increment, decrement]) => {
        if (states.increment.activePointerId !== null && !increment) {
          finishPress('increment')
        }
        if (states.decrement.activePointerId !== null && !decrement) {
          finishPress('decrement')
        }
      },
    ),
  )

  function triggerStep(kind: ControlKind): void {
    const state = states[kind]
    if (!options.isInteractive(kind) || state.activePointerId === null) {
      finishPress(kind)
      return
    }

    const repeat = options.repeat()
    const throttleMs = Math.max(0, repeat?.throttle ?? 0)
    const now = Date.now()

    if (throttleMs > 0 && now - state.lastTriggeredAt < throttleMs) {
      return
    }

    state.lastTriggeredAt = now
    state.repeatStarted = true

    const userOnClick = options.getUserOnClick(kind)
    if (userOnClick) {
      callHandler(new MouseEvent('click', { bubbles: true, cancelable: true }), userOnClick)
    }

    options.onStep(kind)
    options.focusInput()

    if (!options.isInteractive(kind)) {
      finishPress(kind)
    }
  }

  function onPointerDown(kind: ControlKind, event: PointerEvent): void {
    const repeat = options.repeat()
    const allowed = repeat?.pointerTypes ?? 'all'
    const isAllowedPointer = allowed === 'all' || allowed === event.pointerType

    if (!repeat || !options.isInteractive(kind) || event.button !== 0 || !isAllowedPointer) {
      return
    }

    const state = states[kind]
    if (state.activePointerId !== null) {
      return
    }

    state.activePointerId = event.pointerId
    state.targetEl = event.currentTarget as HTMLButtonElement
    state.lastPointerType = event.pointerType
    state.repeatStarted = false
    state.lastTriggeredAt = 0
    setPressedControls((prev) => (prev[kind] ? prev : { ...prev, [kind]: true }))

    if (event.pointerType !== 'mouse' && event.cancelable) {
      event.preventDefault()
    }

    lockSelection()

    const delayMs = Math.max(0, repeat.delay)
    const intervalMs = Math.max(16, repeat.interval)

    state.delayTimer = setTimeout(() => {
      if (state.activePointerId === null) {
        return
      }

      triggerStep(kind)

      if (state.activePointerId === null) {
        return
      }

      state.repeatTimer = setInterval(() => {
        if (state.activePointerId === null) {
          return
        }

        triggerStep(kind)
      }, intervalMs)
    }, delayMs)
  }

  function onPointerUp(kind: ControlKind, event: PointerEvent): void {
    const state = states[kind]
    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(kind)
  }

  function onPointerCancel(kind: ControlKind, event: PointerEvent): void {
    const state = states[kind]
    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(kind)
  }

  function onPointerLeave(kind: ControlKind): void {
    const state = states[kind]
    if (state.activePointerId === null) {
      return
    }

    finishPress(kind)
  }

  const onContextMenu: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    const isTouch = Object.values(states).some(
      (state) =>
        state.targetEl === event.currentTarget &&
        (state.lastPointerType === 'touch' || state.lastPointerType === 'pen'),
    )

    if (isTouch && event.cancelable) {
      event.preventDefault()
    }
  }

  function onClick(
    kind: ControlKind,
    event: Parameters<JSX.EventHandler<HTMLButtonElement, MouseEvent>>[0],
  ): void {
    const state = states[kind]

    if (!options.isInteractive(kind)) {
      if (state.activePointerId !== null) {
        finishPress(kind)
      }
      return
    }

    if (state.repeatStarted) {
      state.repeatStarted = false
      if (event.cancelable) {
        event.preventDefault()
      }
      event.stopPropagation()
      return
    }

    callHandler(event, options.getUserOnClick(kind))

    if (!event.defaultPrevented && options.isInteractive(kind)) {
      options.onStep(kind)
      options.focusInput()
    }
    if (!options.isInteractive(kind) && state.activePointerId !== null) {
      finishPress(kind)
    }
  }

  onCleanup(() => {
    clearRepeatTimers(states.increment)
    clearRepeatTimers(states.decrement)
    if (lockCount > 0 && savedSelection) {
      savedSelection.body.style.setProperty('user-select', savedSelection.userSelect)
      savedSelection.body.style.setProperty('-webkit-user-select', savedSelection.webkitUserSelect)
      savedSelection = null
      lockCount = 0
    }
    setPressedControls({ increment: false, decrement: false })
  })

  return {
    isActive: (kind: ControlKind) => pressedControls()[kind],
    handlers: (kind: ControlKind) => ({
      onClick: (event: Parameters<JSX.EventHandler<HTMLButtonElement, MouseEvent>>[0]) =>
        onClick(kind, event),
      onPointerDown: (event: PointerEvent) => onPointerDown(kind, event),
      onPointerUp: (event: PointerEvent) => onPointerUp(kind, event),
      onPointerCancel: (event: PointerEvent) => onPointerCancel(kind, event),
      onLostPointerCapture: (event: PointerEvent) => onPointerCancel(kind, event),
      onPointerLeave: () => onPointerLeave(kind),
      onContextMenu,
    }),
  }
}
