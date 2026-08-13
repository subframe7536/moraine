import type { Accessor, JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, cn, useId } from '../../shared/utils.ts'

import { useOverlayInteraction } from './interaction.ts'
import { MODAL_CONTENT_CLASS, MODAL_OVERLAY_CLASS } from './modal.class.ts'
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

    /** Root props forwarded by a public modal wrapper. */
    triggerProps?: Partial<OverlayTriggerProps>
  }

  export interface ContentProps {
    /** Receives the mounted content element and `undefined` when it unmounts. */
    ref?: (element: HTMLDivElement | undefined) => void

    /** Whether to render the modal overlay element. */
    overlay?: boolean

    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    overlayRef?: (element: HTMLDivElement | undefined) => void

    /** Class applied to the modal overlay element. */
    overlayClass?: string

    /** Style applied to the modal overlay element. */
    overlayStyle?: JSX.CSSProperties

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

    /**
     * Class applied to the modal content element.
     * When omitted, the default popup transition class is applied.
     */
    class?: string

    /** Style applied to the modal content element. */
    style?: JSX.CSSProperties
  }
}

/** Props for the Modal component. */
export type ModalProps = ModalT.Props

interface ModalContext {
  open: Accessor<boolean>
  presence: ReturnType<typeof useTransitionPresence>
  contentId: Accessor<string>
  updateOpen: (open: boolean) => void
  dismissible: Accessor<boolean>
  triggerElement: Accessor<HTMLElement | undefined>
  setTriggerElement: (element: HTMLElement | undefined) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  setContentElement: (element: HTMLDivElement | undefined) => void
  registerContent: () => () => void
  contentPresent: Accessor<boolean>
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
  const presence = useTransitionPresence({ open: () => Boolean(open()) })
  const [contentRegistrations, setContentRegistrations] = createSignal<Set<number>>(new Set())
  let nextContentRegistrationId = 0
  const dismissible = createMemo(() => props.dismissible ?? true)
  const contentMounted = createMemo(() => contentRegistrations().size > 0)
  const isPresent = createMemo(() => contentMounted() && presence.present())
  const contentPresent = isPresent
  let capturedTrigger: HTMLElement | undefined
  let capturedRestoreTarget: HTMLElement | undefined
  let lastFocusedElement: HTMLElement | undefined
  let hadOpenContent = false
  let closeCycleActive = false

  const updateOpen = (nextOpen: boolean): void => {
    if (nextOpen === !!open()) {
      return
    }

    setOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  createEffect(() => {
    if (open()) {
      if (contentMounted() && presence.present()) {
        hadOpenContent = true
      }
      closeCycleActive = false
      return
    }

    if (hadOpenContent) {
      closeCycleActive = true
    }

    if (closeCycleActive && !presence.present()) {
      closeCycleActive = false
      hadOpenContent = false
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
    presence,
    contentId,
    updateOpen,
    dismissible,
    triggerElement,
    setTriggerElement,
    contentElement,
    setContentElement,
    registerContent: () => {
      const registrationId = nextContentRegistrationId++
      let active = true
      setContentRegistrations((current) => {
        const next = new Set(current)
        next.add(registrationId)
        return next
      })

      return () => {
        if (!active) {
          return
        }

        active = false
        setContentRegistrations((current) => {
          const next = new Set(current)
          next.delete(registrationId)
          return next
        })
      }
    },
    contentPresent,
    isPresent,
  }

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

function ModalTrigger(props: ModalT.TriggerProps): JSX.Element {
  const context = useModalContext()
  const triggerRender = createMemo(() => props.children)
  const userTriggerProps = (): Partial<OverlayTriggerProps> | undefined => props.triggerProps
  const triggerProps = mergeProps(
    {
      get 'aria-controls'() {
        return context.contentPresent() ? context.contentId() : undefined
      },
      get 'aria-expanded'() {
        return context.contentPresent() ? 'true' : 'false'
      },
      'data-slot': 'trigger',
    },
    untrack(userTriggerProps) ?? {},
    {
      ref: (element: HTMLElement | undefined) => {
        context.setTriggerElement(element)
        callRef(userTriggerProps()?.ref, element)
        if (element) {
          onCleanup(() => {
            if (context.triggerElement() === element) {
              context.setTriggerElement(undefined)
            }
            callRef(userTriggerProps()?.ref, undefined)
          })
        }
      },
      onClick: (event: MouseEvent) => {
        callHandler<HTMLElement, MouseEvent>(event, userTriggerProps()?.onClick)
        if (!event.defaultPrevented) {
          context.updateOpen(true)
        }
      },
    },
  ) as OverlayTriggerProps

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
  const presence = context.presence
  const unregisterContent = context.registerContent()
  onCleanup(unregisterContent)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    trapFocusInContainer(event, context.contentElement())
  }

  return (
    <Show when={presence.present()}>
      <Portal>
        <Show when={props.overlay}>
          <div
            data-slot="overlay"
            {...presence.dataAttrs()}
            ref={(element) => {
              const unregister = presence.registerElement(element)
              props.overlayRef?.(element)
              onCleanup(() => {
                unregister()
                props.overlayRef?.(undefined)
              })
            }}
            style={props.overlayStyle}
            class={cn(MODAL_OVERLAY_CLASS, props.overlayClass)}
          />
        </Show>

        <div
          {...props.contentAttributes}
          {...presence.dataAttrs()}
          ref={(element) => {
            const unregister = presence.registerElement(element)
            context.setContentElement(element)
            props.ref?.(element)
            onCleanup(() => {
              unregister()
              if (context.contentElement() === element) {
                context.setContentElement(undefined)
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
          class={props.class ?? MODAL_CONTENT_CLASS}
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

Modal.Content = ModalContent
Modal.Trigger = ModalTrigger
