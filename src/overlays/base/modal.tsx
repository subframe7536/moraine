import type { Accessor, JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useEventListenerMap } from '../../shared/use-event-listener.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { useId } from '../../shared/utils.ts'

import { isInsideDescendantOverlay, isTopOverlay, pushOverlayLayer } from './overlay-stack.ts'
import type { OverlayTriggerProps } from './trigger.ts'
import { validateOverlayTrigger } from './trigger.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusWithoutScrolling,
  focusTrigger,
  trapFocusInContainer,
} from './utils.ts'

export interface ModalContentContext {
  close: () => void
}

export interface ModalRootProps {
  /** Unique identifier used to derive the content id. */
  id?: string
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void
  /** Called after the modal has fully finished its exit motion. */
  onExitComplete?: () => void
  /** Whether outside interaction and Escape should dismiss the shell. */
  dismissible?: boolean
  /** Called when a dismissal attempt is blocked. */
  onClosePrevent?: () => void
  /** Whether body scroll should be locked while the shell is present. */
  preventScroll?: boolean
  /** Whether the composed modal contains an overlay surface. */
  hasOverlay: boolean
  /** Whether the composed modal contains a content surface. */
  hasContent: boolean
  /** Composed trigger and content primitives. */
  children?: JSX.Element
}

export interface ModalTriggerProps {
  children?: (props: OverlayTriggerProps) => JSX.Element
}

export interface ModalContentProps {
  ref?: (element: HTMLDivElement | undefined) => void
  contentRender: ComponentOrElement<ModalContentContext>
  contentAttributes?: Record<string, string | number | boolean | undefined>
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  class?: string
  style?: JSX.CSSProperties
  overlay?: boolean
  overlayClass?: string
  overlayStyle?: JSX.CSSProperties
}

interface ModalContext {
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  dismissible: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  overlayPresence: ReturnType<typeof useTransitionPresence>
  contentPresence: ReturnType<typeof useTransitionPresence>
  isPresent: Accessor<boolean>
}

const [ModalProvider, useModalContext] = createContextProvider<ModalContext>('Modal')

export function ModalRoot(props: ModalRootProps): JSX.Element {
  const rootId = useId(() => props.id, 'modal')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const dismissible = createMemo(() => props.dismissible ?? true)
  const overlayPresence = useTransitionPresence({
    open: () => Boolean(open() && props.hasOverlay),
  })
  const contentPresence = useTransitionPresence({
    open: () => Boolean(open() && props.hasContent),
  })
  const isPresent = createMemo(() => overlayPresence.present() || contentPresence.present())
  const dismissEntry = { contentElement, triggerElement }
  let capturedTrigger: HTMLElement | undefined
  let capturedRestoreTarget: HTMLElement | undefined
  let lastFocusedElement: HTMLElement | undefined
  let wasPresent = false

  const updateOpen = (nextOpen: boolean): void => {
    if (nextOpen === !!open()) {
      return
    }

    setOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  createEffect(() => {
    if (isPresent()) {
      wasPresent = true
      return
    }

    if (wasPresent) {
      wasPresent = false
      props.onExitComplete?.()
    }
  })

  createEffect(() => {
    if (contentPresence.present()) {
      return
    }

    setContentElement(undefined)
    contentPresence.setElement(undefined)
  })

  createEffect(() => {
    if (!isPresent() || typeof document === 'undefined') {
      return
    }

    const currentContent = contentElement()
    queueMicrotask(() => {
      focusContent(currentContent)
    })

    const releaseScrollLock = props.preventScroll === false ? undefined : acquireBodyScrollLock()
    onCleanup(() => {
      releaseScrollLock?.()
    })
  })

  createEffect(() => {
    if (!isPresent() || typeof document === 'undefined') {
      return
    }

    const currentContent = contentElement()
    if (!currentContent) {
      return
    }

    let active = true
    let release: (() => void) | undefined
    queueMicrotask(() => {
      if (active && currentContent.isConnected) {
        release = acquireAriaHideOutside(currentContent)
      }
    })

    onCleanup(() => {
      active = false
      release?.()
    })
  })

  createEffect(() => {
    if (!isPresent() || typeof document === 'undefined') {
      return
    }

    const release = pushOverlayLayer(dismissEntry)
    capturedTrigger = untrack(triggerElement)
    const activeElement = document.activeElement
    capturedRestoreTarget =
      capturedTrigger ??
      (activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : undefined)
    lastFocusedElement = undefined

    const isInside = (target: Node): boolean => {
      if (contentElement()?.contains(target) || triggerElement()?.contains(target)) {
        return true
      }

      return isInsideDescendantOverlay(dismissEntry, target)
    }

    const onDocumentPointerDown = (event: PointerEvent): void => {
      const target = event.target

      if (
        !(target instanceof Node) ||
        isInside(target) ||
        event.button !== 0 ||
        (event.ctrlKey && event.button === 0)
      ) {
        return
      }
      if (!isTopOverlay(dismissEntry) || event.defaultPrevented) {
        return
      }

      if (dismissible()) {
        event.preventDefault()
        updateOpen(false)
        return
      }

      event.preventDefault()
      props.onClosePrevent?.()
    }

    const onDocumentFocusIn = (event: FocusEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || !isTopOverlay(dismissEntry)) {
        return
      }

      const currentContent = contentElement()
      if (target instanceof HTMLElement && currentContent?.contains(target)) {
        lastFocusedElement = target
        return
      }

      if (isInside(target)) {
        return
      }

      queueMicrotask(() => {
        if (lastFocusedElement?.isConnected && currentContent?.contains(lastFocusedElement)) {
          focusWithoutScrolling(lastFocusedElement)
        } else {
          focusContent(currentContent)
        }
      })

      if (!dismissible()) {
        props.onClosePrevent?.()
      }
    }

    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !isTopOverlay(dismissEntry) || event.defaultPrevented) {
        return
      }

      if (dismissible()) {
        event.preventDefault()
        updateOpen(false)
        return
      }

      event.preventDefault()
      props.onClosePrevent?.()
    }

    useEventListenerMap(document, {
      pointerdown: onDocumentPointerDown,
      focusin: onDocumentFocusIn,
      keydown: onDocumentKeyDown,
    })

    onCleanup(() => {
      release()
      const trigger = capturedTrigger
      const restoreTarget = capturedRestoreTarget

      queueMicrotask(() => {
        if (isPresent() || focusTrigger(trigger)) {
          return
        }

        if (restoreTarget !== trigger) {
          focusTrigger(restoreTarget)
        }
      })
    })
  })

  const context: ModalContext = {
    contentId,
    updateOpen,
    dismissible,
    triggerElement,
    setTriggerElement,
    contentElement,
    setContentElement,
    overlayPresence,
    contentPresence,
    isPresent,
  }

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

export function ModalTrigger(props: ModalTriggerProps): JSX.Element {
  const context = useModalContext()
  const triggerRender = createMemo(() => props.children)
  const triggerProps: OverlayTriggerProps = {
    get 'aria-controls'() {
      return context.contentPresence.present() ? context.contentId() : undefined
    },
    get 'aria-expanded'() {
      return context.contentPresence.present() ? 'true' : 'false'
    },
    'data-slot': 'trigger',
    ref: (element: HTMLElement | undefined) => {
      context.setTriggerElement(element)
    },
    onClick: (event: MouseEvent) => {
      if (!event.defaultPrevented) {
        context.updateOpen(true)
      }
    },
  }

  onMount(() => {
    if (triggerRender()) {
      validateOverlayTrigger(context.triggerElement(), 'Modal')
    }
  })

  return (
    <Show when={triggerRender()}>
      {(render) => renderComponentOrElement(render(), triggerProps)}
    </Show>
  )
}

export function ModalContent(props: ModalContentProps): JSX.Element {
  const context = useModalContext()
  const contentRender = createMemo(() => props.contentRender)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    trapFocusInContainer(event, context.contentElement())
  }

  const renderSurface = (): JSX.Element => (
    <Show when={context.contentPresence.present()}>
      <div
        {...props.contentAttributes}
        {...context.contentPresence.dataAttrs()}
        ref={(element) => {
          context.setContentElement(element)
          context.contentPresence.setElement(element)
          props.ref?.(element)
        }}
        id={context.contentId()}
        role="dialog"
        aria-modal="true"
        aria-label={props.ariaLabel}
        aria-labelledby={props.ariaLabelledBy}
        aria-describedby={props.ariaDescribedBy}
        tabIndex={-1}
        data-slot="content"
        style={props.style}
        class={props.class}
        onKeyDown={onContentKeyDown}
      >
        {renderComponentOrElement(contentRender(), {
          close: () => context.updateOpen(false),
        })}
      </div>
    </Show>
  )

  return (
    <Show when={context.isPresent()}>
      <Portal>
        <Show when={props.overlay && context.overlayPresence.present()} fallback={renderSurface()}>
          <div
            data-slot="overlay"
            {...context.overlayPresence.dataAttrs()}
            ref={context.overlayPresence.setElement}
            style={props.overlayStyle}
            class={props.overlayClass}
          >
            {renderSurface()}
          </div>
        </Show>
      </Portal>
    </Show>
  )
}
