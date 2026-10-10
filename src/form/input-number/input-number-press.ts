import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

import { callHandler } from '../../shared/utils'

export type ControlKind = 'increment' | 'decrement'

export interface CreateInputNumberPressOptions {
  isInteractive: (kind: ControlKind) => boolean
  onStep: (kind: ControlKind) => void
  getUserOnClick: (
    kind: ControlKind,
  ) => JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined
  focusInput: () => void
  getDocument: () => Document | undefined
  holdRepeat: () => boolean | undefined
  repeatDelayMs: () => number | undefined
  repeatIntervalMs: () => number | undefined
  repeatThrottleMs: () => number | undefined
  repeatPointerTypes: () => string | undefined
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
  suppressNextClick: boolean
  syntheticClicksPending: number
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
    suppressNextClick: false,
    syntheticClicksPending: 0,
    lastTriggeredAt: 0,
    lastPointerType: undefined,
    targetEl: null,
  }
}

export function createInputNumberPress(options: CreateInputNumberPressOptions) {
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

  function finishPress(kind: ControlKind, suppressClick: boolean): void {
    const state = states[kind]
    if (state.activePointerId === null) {
      return
    }

    clearRepeatTimers(state)
    state.activePointerId = null
    state.targetEl = null
    state.suppressNextClick = suppressClick
    state.repeatStarted = false
    setPressedControls((prev) => (prev[kind] ? { ...prev, [kind]: false } : prev))
    unlockSelection()
  }

  function isAllowedPointerType(pointerType: string): boolean {
    const allowed = options.repeatPointerTypes() ?? 'all'
    return allowed === 'all' || allowed === pointerType
  }

  // Cancel hold immediately when callback or reactive state makes control non-interactive.
  createEffect(
    on(
      [() => options.isInteractive('increment'), () => options.isInteractive('decrement')],
      ([increment, decrement]) => {
        if (states.increment.activePointerId !== null && !increment) {
          finishPress('increment', false)
        }
        if (states.decrement.activePointerId !== null && !decrement) {
          finishPress('decrement', false)
        }
      },
    ),
  )

  function triggerControlClick(kind: ControlKind): void {
    const state = states[kind]
    if (!options.isInteractive(kind) || state.activePointerId === null) {
      finishPress(kind, false)
      return
    }

    const throttleMs = Math.max(0, options.repeatThrottleMs() ?? 0)
    const now = Date.now()

    if (throttleMs > 0 && now - state.lastTriggeredAt < throttleMs) {
      return
    }

    state.lastTriggeredAt = now
    state.repeatStarted = true
    state.suppressNextClick = true
    state.syntheticClicksPending += 1
    state.targetEl?.click()
  }

  function onPointerDown(kind: ControlKind, event: PointerEvent): void {
    if (
      options.holdRepeat() === false ||
      !options.isInteractive(kind) ||
      event.button !== 0 ||
      !isAllowedPointerType(event.pointerType)
    ) {
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
    state.suppressNextClick = false
    state.lastTriggeredAt = 0
    setPressedControls((prev) => (prev[kind] ? prev : { ...prev, [kind]: true }))

    if (event.pointerType !== 'mouse' && event.cancelable) {
      event.preventDefault()
    }

    lockSelection()

    const delayMs = Math.max(0, options.repeatDelayMs() ?? 500)
    const intervalMs = Math.max(16, options.repeatIntervalMs() ?? 80)

    state.delayTimer = setTimeout(() => {
      if (state.activePointerId === null) {
        return
      }

      triggerControlClick(kind)

      if (state.activePointerId === null) {
        return
      }

      state.repeatTimer = setInterval(() => {
        if (state.activePointerId === null) {
          return
        }

        triggerControlClick(kind)
      }, intervalMs)
    }, delayMs)
  }

  function onPointerUp(kind: ControlKind, event: PointerEvent): void {
    const state = states[kind]
    if (state.activePointerId !== event.pointerId) {
      return
    }

    const shouldSynthesizeClick = !state.repeatStarted && state.lastPointerType !== 'mouse'

    if (shouldSynthesizeClick) {
      state.syntheticClicksPending += 1
      state.targetEl?.click()
    }

    finishPress(kind, state.repeatStarted || shouldSynthesizeClick)
  }

  function onPointerCancel(kind: ControlKind, event: PointerEvent): void {
    const state = states[kind]
    if (state.activePointerId !== event.pointerId) {
      return
    }

    finishPress(kind, false)
  }

  function onPointerLeave(kind: ControlKind): void {
    const state = states[kind]
    if (state.activePointerId === null) {
      return
    }

    finishPress(kind, false)
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
        finishPress(kind, false)
      }
      return
    }

    if (state.syntheticClicksPending > 0) {
      state.syntheticClicksPending -= 1
      callHandler(event, options.getUserOnClick(kind))
      if (!event.defaultPrevented && options.isInteractive(kind)) {
        options.onStep(kind)
        options.focusInput()
      }
      if (!options.isInteractive(kind) && state.activePointerId !== null) {
        finishPress(kind, true)
      }
      return
    }

    if (state.suppressNextClick) {
      state.suppressNextClick = false
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
      finishPress(kind, false)
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
