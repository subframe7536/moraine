import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'

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
  setContentElement: (element: HTMLElement | undefined) => void
  registerElement: (element: HTMLElement) => () => void
  registerPresenceElement: (element: HTMLElement) => () => void
  registerContentElement: (element: HTMLElement) => () => void
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

  const presence = createTransitionPresence({
    open: options.open,
    onExitComplete: options.onExitComplete,
  })

  const closed = createMemo(() => !options.open())
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
  const inert = createMemo(() => (closed() ? true : undefined))
  const ariaHidden = createMemo(() => (closed() ? true : undefined))

  const [hasToggled, setHasToggled] = createSignal(false)

  createEffect(
    on(
      options.open,
      () => {
        setHasToggled(true)
      },
      { defer: true },
    ),
  )

  const initialOpen = createMemo(() => options.open() && !hasToggled())

  function shouldMount(opts?: ShouldMountOptions): boolean {
    if (opts?.forceMount) {
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
  let registeredContentElement: HTMLElement | undefined
  let customMeasureElement: HTMLElement | undefined
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

  function setContentElement(element: HTMLElement | undefined): void {
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

  function updateMeasurementTarget(): void {
    const target = customMeasureElement ?? registeredContentElement
    setContentElement(target)
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

  function registerPresenceElement(element: HTMLElement): () => void {
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
      removeContentFocusListeners = undefined
      setContentElementSignal(undefined)
    }
  }

  function registerContentElement(element: HTMLElement): () => void {
    const releasePresence = registerPresenceElement(element)
    registeredContentElement = element
    updateMeasurementTarget()

    return () => {
      releasePresence()
      if (registeredContentElement === element) {
        registeredContentElement = undefined
        updateMeasurementTarget()
      }
    }
  }

  function registerMeasureElement(element: HTMLElement): () => void {
    customMeasureElement = element
    updateMeasurementTarget()

    return () => {
      if (customMeasureElement === element) {
        customMeasureElement = undefined
        updateMeasurementTarget()
      }
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
    setContentElement,
    registerElement(element: HTMLElement): () => void {
      return registerContentElement(element)
    },
    registerPresenceElement,
    registerContentElement,
    registerMeasureElement,
    restoreTriggerFocus,
  }
}
