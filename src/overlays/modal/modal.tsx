import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, cn, useId } from '../../shared/utils.ts'
import { useOverlayInteraction } from '../base/interaction.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusWithoutScrolling,
  focusTrigger,
  trapFocusInContainer,
} from '../base/utils.ts'

import { ModalProvider, useModalContext } from './modal-context.ts'
import { ModalTrigger } from './modal-trigger.tsx'
import {
  MODAL_CONTENT_CLASS,
  MODAL_CONTENT_DEFAULT_CLASS,
  MODAL_OVERLAY_CLASS,
} from './modal.class.ts'

type ModalTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

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

  export interface Slot<_T = unknown> {}
  export type Variant = never
  export type Classes = never
  export type Styles = never
  export interface Item {}

  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /** Element or component to render as. @default 'button' */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never
    /** Whether this trigger is disabled. */
    disabled?: boolean
    onClick?: JSX.EventHandlerUnion<ModalTriggerElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<ModalTriggerElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<ModalTriggerElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<ModalTriggerElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<ModalTriggerElementFor<T>, PointerEvent>
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never
  >

  export interface ContentBase {
    /** Whether to render the modal overlay element. */
    overlay?: boolean

    /** Whether the overlay should contain and scroll the modal content. */
    overlayScroll?: boolean

    /** Receives the mounted overlay element and `undefined` when it unmounts. */
    overlayRef?: (element: HTMLDivElement | undefined) => void

    /** Class applied to the modal overlay element. */
    overlayClass?: string

    /** Style applied to the modal overlay element. */
    overlayStyle?: JSX.CSSProperties

    /** Component or element rendered inside the modal content surface. */
    children: ComponentOrElement<ContentContext>

    /** Accessible name used when no visible label is available. */
    ariaLabel?: string

    /** Id of the element that labels the modal content. */
    ariaLabelledBy?: string

    /** Id of the element that describes the modal content. */
    ariaDescribedBy?: string
  }

  export type ContentProps = BaseProps<'div', ContentBase, Variant, never, never>
}

/** Props for the Modal component. */
export type ModalProps = ModalT.Props

/** Low-level modal primitives for composing custom dialog surfaces. */
export function Modal(props: ModalProps): JSX.Element {
  const merged = mergeProps(
    {
      dismissible: true,
      preventScroll: true,
    },
    props,
  )

  const rootId = useId(() => merged.id, 'modal')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const presence = useTransitionPresence({ open: () => Boolean(open()) })
  const [contentRegistrations, setContentRegistrations] = createSignal<Set<number>>(new Set())
  let nextContentRegistrationId = 0
  const dismissible = createMemo(() => merged.dismissible ?? true)
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
    merged.onOpenChange?.(nextOpen)
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
      merged.onExitComplete?.()
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

    const releaseScrollLock = merged.preventScroll === false ? undefined : acquireBodyScrollLock()
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
        merged.onClosePrevent?.()
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
      merged.onClosePrevent?.()
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

  const context = {
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

  return <ModalProvider value={context}>{merged.children}</ModalProvider>
}

function ModalContent(props: ModalT.ContentProps): JSX.Element {
  type RuntimeProps = ModalT.ContentBase & {
    class?: string
    style?: JSX.CSSProperties | string
    ref?: (element: HTMLDivElement | undefined) => void
    onKeyDown?: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'ref',
    'overlay',
    'overlayScroll',
    'overlayRef',
    'overlayClass',
    'overlayStyle',
    'children',
    'ariaLabel',
    'ariaLabelledBy',
    'ariaDescribedBy',
    'class',
    'style',
    'onKeyDown',
  ])
  const context = useModalContext()
  const children = createLazyMemo(() => local.children)
  const overlayScroll = createMemo(() => Boolean(local.overlayScroll && local.overlay))
  const renderOutsideOverlay = createMemo(() => !overlayScroll())
  const hasOverlay = createMemo(() => Boolean(props.overlay))
  const presence = context.presence
  const unregisterContent = context.registerContent()
  onCleanup(unregisterContent)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    callHandler(event, local.onKeyDown)
    if (event.defaultPrevented) {
      return
    }
    trapFocusInContainer(event, context.contentElement())
  }

  const renderOverlay = (content?: JSX.Element): JSX.Element => (
    <div
      data-slot="overlay"
      {...presence.dataAttrs()}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        local.overlayRef?.(element)
        onCleanup(() => {
          unregister()
          local.overlayRef?.(undefined)
        })
      }}
      style={local.overlayStyle}
      class={cn(
        local.overlayClass ?? MODAL_OVERLAY_CLASS,
        local.overlayScroll && 'p-4 overflow-y-auto',
      )}
    >
      {content}
    </div>
  )

  const renderContent = (): JSX.Element => (
    <div
      {...rest}
      {...presence.dataAttrs()}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        context.setContentElement(element)
        callRef(local.ref, element)
        onCleanup(() => {
          unregister()
          if (context.contentElement() === element) {
            context.setContentElement(undefined)
            callRef(local.ref, undefined)
          }
        })
      }}
      id={context.contentId()}
      role="dialog"
      aria-modal="true"
      aria-label={local.ariaLabel}
      aria-labelledby={local.ariaLabelledBy}
      aria-describedby={local.ariaDescribedBy}
      tabIndex={-1}
      data-slot="content"
      style={local.style}
      class={local.class ?? `${MODAL_CONTENT_CLASS} ${MODAL_CONTENT_DEFAULT_CLASS}`}
      onKeyDown={onContentKeyDown}
    >
      {renderComponentOrElement(children(), {
        close: () => context.updateOpen(false),
      })}
    </div>
  )

  return (
    <Show when={presence.present()}>
      <Portal>
        <Show when={overlayScroll()}>{(_value) => renderOverlay(renderContent())}</Show>
        <Show when={renderOutsideOverlay()}>
          {(_value) => (
            <>
              <Show when={hasOverlay()}>{(_value) => renderOverlay()}</Show>
              {renderContent()}
            </>
          )}
        </Show>
      </Portal>
    </Show>
  )
}

Modal.Content = ModalContent
Modal.Trigger = ModalTrigger
