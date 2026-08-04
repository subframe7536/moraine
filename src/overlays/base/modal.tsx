import type { Accessor, JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useEventListenerMap } from '../../shared/use-event-listener.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, cn, useId } from '../../shared/utils.ts'

import { isInsideDescendantOverlay, isTopOverlay, pushOverlayLayer } from './overlay-stack.ts'
import { acquireBodyScrollLock, focusContent, focusTrigger, trapFocusInContainer } from './utils.ts'

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

export interface ModalTriggerProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  children?: JSX.Element
}

export interface ModalContentProps {
  ref?: (element: HTMLDivElement | undefined) => void
  contentRender: ComponentOrElement<ModalContentContext>
  contentAttributes?: Record<string, string | number | boolean | undefined>
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
  triggerElement: Accessor<HTMLSpanElement | undefined>
  setTriggerElement: (element: HTMLSpanElement | undefined) => void
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
  const [triggerElement, setTriggerElement] = createSignal<HTMLSpanElement | undefined>()
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
  let capturedTrigger: HTMLSpanElement | undefined
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

    const release = pushOverlayLayer(dismissEntry)
    capturedTrigger = triggerElement() ?? capturedTrigger

    const isInside = (target: Node): boolean => {
      if (contentElement()?.contains(target) || triggerElement()?.contains(target)) {
        return true
      }

      return isInsideDescendantOverlay(dismissEntry, target)
    }

    const onDocumentPointerDown = (event: PointerEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
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

      if (!(target instanceof Node) || isInside(target) || !isTopOverlay(dismissEntry)) {
        return
      }

      const currentContent = contentElement()
      queueMicrotask(() => {
        focusContent(currentContent)
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
        updateOpen(false)
        return
      }

      event.preventDefault()
      props.onClosePrevent?.()
    }

    useEventListenerMap(
      document,
      {
        pointerdown: onDocumentPointerDown,
        focusin: onDocumentFocusIn,
        keydown: onDocumentKeyDown,
      },
      true,
    )

    onCleanup(() => {
      release()
      focusTrigger(capturedTrigger)
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
  // Resolve actual children once because the value is inspected by Show and rendered below it.
  const children = createMemo(() => props.children)
  const [local, rest] = splitProps(props, ['class', 'style', 'ref', 'onClick', 'children'])

  return (
    <Show when={children()}>
      {(body) => (
        <span
          data-slot="trigger"
          {...rest}
          ref={(element) => {
            context.setTriggerElement(element)
            callRef(local.ref, element)
          }}
          tabIndex={-1}
          style={local.style}
          class={cn('outline-none', local.class)}
          onClick={(event) => {
            const { defaultPrevented } = callHandler(event, local.onClick)
            if (!defaultPrevented) {
              context.updateOpen(true)
            }
          }}
        >
          {body()}
        </span>
      )}
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
