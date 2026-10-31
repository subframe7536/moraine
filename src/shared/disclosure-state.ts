import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js'

import { attachEventListenerMap } from './event-listener'
import { createTransitionPresence } from './transition-presence'
import type { TransitionPresenceState } from './transition-presence'

export interface CreateDisclosureStateOptions {
  /** Reactive open state accessor */
  open: Accessor<boolean>
  /** Reactive disabled accessor */
  disabled?: Accessor<boolean>
  /** Whether transition animations are enabled (defaults to true) */
  transition?: Accessor<boolean> | boolean
  /** Whether content unmounts when closed (defaults to true) */
  unmountOnHide?: Accessor<boolean | undefined> | boolean
  /** Force mounting the content in the DOM even when closed (defaults to false) */
  forceMount?: Accessor<boolean | undefined> | boolean
  /** Callback when exit transition completes */
  onExitComplete?: () => void
}

export interface ShouldMountOptions {
  forceMount?: boolean
  unmountOnHide?: boolean
}

export interface DisclosureState {
  open: Accessor<boolean>
  initialOpen: Accessor<boolean>
  disabled: Accessor<boolean>
  transition: Accessor<boolean>
  unmountOnHide: Accessor<boolean>
  forceMount: Accessor<boolean>

  contentHeight: Accessor<number>
  dataAttrs: {
    readonly 'data-closed'?: string
    readonly 'data-disabled'?: string
    readonly 'data-expanded'?: string
  }

  closed: Accessor<boolean>
  exiting: Accessor<boolean>
  hidden: Accessor<boolean>
  inert: Accessor<true | undefined>
  ariaHidden: Accessor<true | undefined>

  shouldMount: (options?: ShouldMountOptions) => boolean

  presence: TransitionPresenceState

  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void

  contentElement: Accessor<HTMLElement | undefined>
  /**
   * Registers the content shell: keeps it mounted through its exit animation and restores trigger
   * focus when it closes while focused. Returns a release function.
   */
  registerContentElement: (element: HTMLElement) => () => void
  /**
   * Registers the element whose `scrollHeight` feeds `contentHeight`. The latest registration wins;
   * releasing it falls back to the previous one. Returns a release function.
   */
  registerMeasureElement: (element: HTMLElement) => () => void

  restoreTriggerFocus: () => void
}

export function createDisclosureState(options: CreateDisclosureStateOptions): DisclosureState {
  const disabled = createMemo(() => Boolean(options.disabled?.()))
  const transition = createMemo(() =>
    typeof options.transition === 'function' ? options.transition() : (options.transition ?? true),
  )
  const unmountOnHide = createMemo(() => {
    if (typeof options.unmountOnHide === 'function') {
      return options.unmountOnHide() ?? true
    }
    return options.unmountOnHide ?? true
  })
  const forceMount = createMemo(() => {
    if (typeof options.forceMount === 'function') {
      return Boolean(options.forceMount())
    }
    return Boolean(options.forceMount)
  })

  const presence = createTransitionPresence({
    open: options.open,
    onExitComplete: options.onExitComplete,
  })

  const closed = () => !options.open()
  const dataAttrs = {
    get 'data-closed'() {
      return closed() ? '' : undefined
    },
    get 'data-disabled'() {
      return disabled() ? '' : undefined
    },
    get 'data-expanded'() {
      return options.open() ? '' : undefined
    },
  }
  const exiting = createMemo(() => closed() && transition() && presence.present())
  const hidden = createMemo(() => closed() && !exiting())
  const inert = () => (closed() ? (true as const) : undefined)
  const ariaHidden = () => (closed() ? (true as const) : undefined)

  const [hasToggled, setHasToggled] = createSignal(false)

  createEffect(
    on(
      options.open,
      (isOpen, wasOpen) => {
        if (isOpen !== wasOpen) {
          setHasToggled(true)
        }
      },
      { defer: true },
    ),
  )

  const initialOpen = createMemo(() => options.open() && !hasToggled())

  function shouldMount(opts?: ShouldMountOptions): boolean {
    if (opts?.forceMount ?? forceMount()) {
      return true
    }
    const shouldUnmount = opts?.unmountOnHide ?? unmountOnHide()
    if (!shouldUnmount) {
      return true
    }
    return options.open() || (transition() && presence.present())
  }

  const [contentHeight, setContentHeight] = createSignal(0)
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElementSignal] = createSignal<HTMLElement | undefined>()

  let contentEl: HTMLElement | undefined
  // One record per registration, so releasing a duplicate removes only its own entry.
  const measureRegistrations: Array<{ element: HTMLElement }> = []
  let resizeObserver: ResizeObserver | undefined

  let contentHasFocus = false
  let removeContentFocusListeners: (() => void) | undefined

  function measureContentHeight(element = contentEl): void {
    if (!element || element !== contentEl) {
      return
    }

    setContentHeight(element.scrollHeight)
  }

  function queueContentHeightMeasurement(element = contentEl): void {
    queueMicrotask(() => {
      if (!element?.isConnected) {
        return
      }

      measureContentHeight(element)
    })
  }

  createEffect(
    on(options.open, () => {
      queueContentHeightMeasurement()
    }),
  )

  function observeMeasureElement(element: HTMLElement | undefined): void {
    if (element === contentEl) {
      return
    }
    resizeObserver?.disconnect()
    resizeObserver = undefined
    contentEl = element
    if (!element) {
      setContentHeight(0)
      return
    }
    measureContentHeight(element)
    queueContentHeightMeasurement(element)

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        if (element.isConnected) {
          measureContentHeight(element)
        }
      })
      resizeObserver.observe(element)
    }
  }

  function restoreTriggerFocus(): void {
    const content = contentElement()
    const trigger = triggerElement()

    if (contentHasFocus || content?.contains(content.ownerDocument.activeElement)) {
      contentHasFocus = false
      trigger?.focus()
    }
  }

  createEffect(
    on(options.open, (isOpen) => {
      if (!isOpen) {
        restoreTriggerFocus()
      }
    }),
  )

  function registerContentElement(element: HTMLElement): () => void {
    removeContentFocusListeners?.()
    removeContentFocusListeners = undefined
    setContentElementSignal(element)

    contentHasFocus = element.contains(element.ownerDocument.activeElement)
    const onFocusIn = () => {
      contentHasFocus = true
    }
    const onFocusOut = (event: FocusEvent) => {
      if (options.open() && !element.contains(event.relatedTarget as Node | null)) {
        contentHasFocus = false
      }
    }
    const removeListeners = attachEventListenerMap(element, {
      focusin: onFocusIn,
      focusout: onFocusOut,
    })
    removeContentFocusListeners = removeListeners

    const releasePresence = presence.registerElement(element)

    return () => {
      releasePresence()
      removeListeners()
      if (removeContentFocusListeners === removeListeners) {
        removeContentFocusListeners = undefined
      }
      if (untrack(contentElement) === element) {
        setContentElementSignal(undefined)
      }
    }
  }

  function registerMeasureElement(element: HTMLElement): () => void {
    const registration = { element }
    measureRegistrations.push(registration)
    observeMeasureElement(element)

    return () => {
      const index = measureRegistrations.indexOf(registration)
      if (index < 0) {
        return
      }
      measureRegistrations.splice(index, 1)
      observeMeasureElement(measureRegistrations[measureRegistrations.length - 1]?.element)
    }
  }

  onCleanup(() => {
    contentEl = undefined
    resizeObserver?.disconnect()
    resizeObserver = undefined
    removeContentFocusListeners?.()
  })

  return {
    open: options.open,
    initialOpen,
    disabled,
    transition,
    unmountOnHide,
    forceMount,
    contentHeight,
    dataAttrs,
    closed,
    exiting,
    hidden,
    inert,
    ariaHidden,
    shouldMount,
    presence,
    triggerElement,
    setTriggerElement,
    contentElement,
    registerContentElement,
    registerMeasureElement,
    restoreTriggerFocus,
  }
}
