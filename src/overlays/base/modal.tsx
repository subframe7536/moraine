import type { Accessor, JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { useId } from '../../shared/utils.ts'

import { useOverlayInteraction } from './interaction.ts'
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

export namespace ModalT {
  export interface ContentContext {
    /** Closes the modal. */
    close: () => void
  }

  export interface Base {
    /** Unique identifier used to derive the content id. */
    id?: string

    /** Controlled open state. */
    open?: boolean

    /**
     * Initial open state when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean

    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void

    /** Called after the modal has fully finished its exit motion. */
    onExitComplete?: () => void

    /**
     * Whether outside interaction and Escape should dismiss the shell.
     * @default true
     */
    dismissible?: boolean

    /** Called when a dismissal attempt is blocked. */
    onClosePrevent?: () => void

    /**
     * Whether body scroll should be locked while the shell is present.
     * @default true
     */
    preventScroll?: boolean

    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }

  export type Props = Base

  export interface TriggerProps {
    /** Render the modal trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  export interface ContentProps {
    /** Receives the mounted content element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

    /** Component or element rendered inside the modal content surface. */
    contentRender: ComponentOrElement<ContentContext>

    /** Additional attributes applied to the modal content element. */
    contentAttributes?: Record<string, string | number | boolean | undefined>

    /** Accessible name used when no visible label is available. */
    ariaLabel?: string

    /** Id of the element that labels the modal content. */
    ariaLabelledBy?: string

    /** Id of the element that describes the modal content. */
    ariaDescribedBy?: string

    /** Class applied to the modal content element. */
    class?: string

    /** Style applied to the modal content element. */
    style?: JSX.CSSProperties
  }

  export interface OverlayProps {
    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

    /** Class applied to the modal overlay element. */
    class?: string

    /** Style applied to the modal overlay element. */
    style?: JSX.CSSProperties
  }
}

/** Props for the Modal component. */
export type ModalProps = ModalT.Props

type ModalSurface = 'content' | 'overlay'

interface ModalContext {
  open: Accessor<boolean>
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  dismissible: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  contentPresent: Accessor<boolean>
  registerSurface: (
    surface: ModalSurface,
    presence: ReturnType<typeof useTransitionPresence>,
  ) => () => void
  isPresent: Accessor<boolean>
}

const [ModalProvider, useModalContext] = createContextProvider<ModalContext>('Modal')

/** Low-level modal primitives for composing custom dialog surfaces. */
export function Modal(props: ModalProps): JSX.Element {
  const rootId = useId(() => props.id, 'modal')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [surfaces, setSurfaces] = createSignal<
    Array<{ surface: ModalSurface; presence: ReturnType<typeof useTransitionPresence> }>
  >([])
  const dismissible = createMemo(() => props.dismissible ?? true)
  const isPresent = createMemo(() => surfaces().some(({ presence }) => presence.present()))
  const contentPresent = createMemo(() =>
    surfaces().some(({ surface, presence }) => surface === 'content' && presence.present()),
  )
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

  useOverlayInteraction({
    enabled: isPresent,
    contentElement,
    triggerElement,
    onActivate: () => {
      capturedTrigger = untrack(triggerElement)
      const activeElement = document.activeElement
      capturedRestoreTarget =
        capturedTrigger ??
        (activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : undefined)
      lastFocusedElement = undefined
    },
    onPointerDownInside: (event, context) => {
      const target = event.target
      const currentContent = contentElement()
      if (
        target instanceof Node &&
        currentContent &&
        (currentContent.contains(target) || event.composedPath().includes(currentContent))
      ) {
        queueMicrotask(() => {
          untrack(() => {
            if (!isPresent() || !context.isTop() || !currentContent.isConnected) {
              return
            }

            const activeElement = document.activeElement
            if (activeElement instanceof Node && currentContent.contains(activeElement)) {
              return
            }

            if (lastFocusedElement?.isConnected && currentContent.contains(lastFocusedElement)) {
              focusWithoutScrolling(lastFocusedElement)
            } else {
              focusContent(currentContent)
            }
          })
        })
      }
    },
    onPointerOutside: (event) => {
      if (event.defaultPrevented) {
        return
      }

      if (dismissible()) {
        event.preventDefault()
        updateOpen(false)
        return
      }

      event.preventDefault()
      props.onClosePrevent?.()
    },
    onFocusInside: (event) => {
      const target = event.target
      const currentContent = contentElement()
      if (target instanceof HTMLElement && currentContent?.contains(target)) {
        lastFocusedElement = target
      }
    },
    onFocusOutside: () => {
      const currentContent = contentElement()
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
    },
    onEscape: (event) => {
      if (event.defaultPrevented) {
        return
      }

      if (dismissible()) {
        event.preventDefault()
        updateOpen(false)
        return
      }

      event.preventDefault()
      props.onClosePrevent?.()
    },
    onDeactivate: () => {
      const trigger = capturedTrigger
      const restoreTarget = capturedRestoreTarget

      queueMicrotask(() => {
        untrack(() => {
          if (isPresent() || focusTrigger(trigger)) {
            return
          }

          if (restoreTarget !== trigger) {
            focusTrigger(restoreTarget)
          }
        })
      })
    },
  })

  const context: ModalContext = {
    open: () => Boolean(open()),
    contentId,
    updateOpen,
    dismissible,
    triggerElement,
    setTriggerElement,
    contentElement,
    setContentElement,
    contentPresent,
    registerSurface: (surface, presence) => {
      const entry = { surface, presence }
      setSurfaces((current) => [...current, entry])

      return () => {
        setSurfaces((current) => current.filter((candidate) => candidate !== entry))
      }
    },
    isPresent,
  }

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

function ModalTrigger(props: ModalT.TriggerProps): JSX.Element {
  const context = useModalContext()
  const triggerRender = createMemo(() => props.children)
  const triggerProps: OverlayTriggerProps = {
    get 'aria-controls'() {
      return context.contentPresent() ? context.contentId() : undefined
    },
    get 'aria-expanded'() {
      return context.contentPresent() ? 'true' : 'false'
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

function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const context = useModalContext()
  const contentRender = createMemo(() => props.contentRender)
  const presence = useTransitionPresence({ open: context.open })
  const unregister = context.registerSurface('content', presence)
  onCleanup(unregister)

  createEffect(() => {
    if (presence.present()) {
      return
    }

    context.setContentElement(undefined)
    presence.setElement(undefined)
  })

  const onContentKeyDown = (event: KeyboardEvent): void => {
    trapFocusInContainer(event, context.contentElement())
  }

  return (
    <Show when={presence.present()}>
      <Portal>
        <div
          {...props.contentAttributes}
          {...presence.dataAttrs()}
          ref={(element) => {
            context.setContentElement(element)
            presence.setElement(element)
            props.ref?.(element)
            onCleanup(() => {
              if (context.contentElement() === element) {
                context.setContentElement(undefined)
                presence.setElement(undefined)
                props.ref?.(undefined)
              }
            })
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
      </Portal>
    </Show>
  )
}

function ModalOverlay(props: ModalT.OverlayProps): JSX.Element {
  const context = useModalContext()
  const presence = useTransitionPresence({ open: context.open })
  const unregister = context.registerSurface('overlay', presence)
  onCleanup(unregister)

  return (
    <Show when={presence.present()}>
      <Portal>
        <div
          data-slot="overlay"
          {...presence.dataAttrs()}
          ref={(element) => {
            presence.setElement(element)
            props.ref?.(element)
            onCleanup(() => {
              presence.setElement(undefined)
              props.ref?.(undefined)
            })
          }}
          style={props.style}
          class={props.class}
        />
      </Portal>
    </Show>
  )
}

Modal.Content = ModalContent
Modal.Overlay = ModalOverlay
Modal.Trigger = ModalTrigger
