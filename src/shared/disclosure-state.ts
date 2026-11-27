import type { Accessor } from 'solid-js'
import {
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js'

import { attachEventListener, attachEventListenerMap } from './event-listener'
import { createTransitionPresence } from './transition-presence'
import type { TransitionPresenceState } from './transition-presence'
export interface CreateDisclosureStateOptions {
  /** Reactive open state accessor */
  open: Accessor<boolean>
  /** Reactive disabled accessor */
  disabled?: Accessor<boolean>
  /** Whether transition animations are enabled (defaults to true) */
  transition?: Accessor<boolean> | boolean
  /** Whether content stays mounted when closed (defaults to false) */
  forceMount?: Accessor<boolean | undefined> | boolean
  /** Callback when exit transition completes */
  onExitComplete?: () => void
  /**
   * Called on `beforematch` on the registered content element. Providing it opts the
   * kept-mounted closed content into `hidden="until-found"`: in-page search reveals the
   * shell and fires the callback so the consumer can open. When the callback leaves the
   * disclosure closed (disabled item, refused controlled change) the attribute is restored.
   */
  onBeforeMatch?: () => void
  /**
   * Reads the height of the registered measure element (defaults to `scrollHeight`). Content laid
   * out in normal flow can use `offsetHeight`, which ignores overflow such as transformed children.
   */
  measure?: (element: HTMLElement) => number
}

export interface DisclosureState {
  open: Accessor<boolean>
  initialOpen: Accessor<boolean>
  disabled: Accessor<boolean>
  transition: Accessor<boolean>
  forceMount: Accessor<boolean>

  contentHeight: Accessor<number>
  dataAttrs: {
    readonly 'data-closed'?: string
    readonly 'data-disabled'?: string
    readonly 'data-expanded'?: string
  }

  closed: Accessor<boolean>
  exiting: Accessor<boolean>
  hidden: Accessor<boolean | 'until-found'>
  /** `hidden` attribute value for the content shell (`''`, `'until-found'`, or absent). */
  hiddenAttr: Accessor<'' | 'until-found' | undefined>
  inert: Accessor<true | undefined>
  ariaHidden: Accessor<'true' | undefined>

  shouldMount: () => boolean

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
   * Registers the element whose measured height feeds `contentHeight`. The latest registration wins;
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
  const forceMount = createMemo(() =>
    typeof options.forceMount === 'function'
      ? Boolean(options.forceMount())
      : Boolean(options.forceMount),
  )

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
  const hidden = createMemo((): boolean | 'until-found' => {
    if (!closed() || exiting()) {
      return false
    }
    // Only opted-in shells stay findable by in-page search, which reveals them via `beforematch`.
    return options.onBeforeMatch && shouldMount() ? 'until-found' : true
  })
  const hiddenAttr = createMemo((): '' | 'until-found' | undefined => {
    const value = hidden()
    return value === 'until-found' ? 'until-found' : value ? '' : undefined
  })
  const inert = () => (closed() ? (true as const) : undefined)
  const ariaHidden = () => (closed() ? ('true' as const) : undefined)

  const initialOpen = createMemo<boolean>((previous) =>
    previous === false ? false : options.open(),
  )

  function shouldMount(): boolean {
    if (forceMount()) {
      return true
    }
    return options.open() || (transition() && presence.present())
  }

  const [contentHeight, setContentHeight] = createSignal(0)
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>(undefined)
  const [contentElement, setContentElementSignal] = createSignal<HTMLElement | undefined>(undefined)

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

    setContentHeight(options.measure ? options.measure(element) : element.scrollHeight)
  }

  function queueContentHeightMeasurement(element = contentEl): void {
    queueMicrotask(() => {
      if (!element?.isConnected) {
        return
      }

      measureContentHeight(element)
    })
  }

  createEffect(options.open, () => {
    queueContentHeightMeasurement()
  })

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

  if (options.onBeforeMatch) {
    // The `hidden` JSX prop coerces to boolean in some DOMs; sync the raw
    // attribute so `until-found` survives jsdom and hydrated SSR markup.
    createRenderEffect(
      () => [contentElement(), hiddenAttr()] as const,
      ([element, value]) => {
        if (!element) {
          return
        }
        if (value === undefined) {
          element.removeAttribute('hidden')
        } else {
          element.setAttribute('hidden', value)
        }
      },
    )
  }

  function restoreTriggerFocus(): void {
    // Snapshot reads inside an effect callback: the tracked dep is `open`;
    // whichever elements are current when it closes get the focus check.
    const content = untrack(contentElement)
    const trigger = untrack(triggerElement)

    if (contentHasFocus || content?.contains(content.ownerDocument.activeElement)) {
      contentHasFocus = false
      trigger?.focus()
    }
  }

  createEffect(options.open, (isOpen) => {
    if (!isOpen) {
      restoreTriggerFocus()
    }
  })

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

    let removeBeforeMatch: (() => void) | undefined
    if (options.onBeforeMatch) {
      const reveal = options.onBeforeMatch
      removeBeforeMatch = attachEventListener(element, 'beforematch', () => {
        reveal()
        // The reveal strips `hidden`; restore it when the open was refused.
        const value = hiddenAttr()
        if (value !== undefined) {
          element.setAttribute('hidden', value)
        }
      })
    }

    return () => {
      removeBeforeMatch?.()
      releasePresence()
      removeListeners()
      if (removeContentFocusListeners === removeListeners) {
        removeContentFocusListeners = undefined
      }
      setContentElementSignal((current) => (current === element ? undefined : current))
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
      observeMeasureElement(measureRegistrations.at(-1)?.element)
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
    forceMount,
    contentHeight,
    dataAttrs,
    closed,
    exiting,
    hidden,
    hiddenAttr,
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
