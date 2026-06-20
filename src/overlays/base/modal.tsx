import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'

import type { MaybeRenderProp } from '../../shared/render-prop'
import { resolveRenderProp } from '../../shared/render-prop'
import type { SlotClasses, SlotStyles } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useEventListenerMap } from '../../shared/use-event-listener'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { cn, useId } from '../../shared/utils'

import { isInsideDescendantOverlay, isTopOverlay, pushOverlayLayer } from './overlay-stack'
import { acquireBodyScrollLock, focusContent, focusTrigger, trapFocusInContainer } from './utils'

type ModalSlot = 'trigger' | 'overlay' | 'content'

export interface ModalContentContext {
  close: () => void
}

export interface ModalProps {
  /** Unique identifier used to derive the content id. */
  id?: string
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void
  /** Whether outside interaction and Escape should dismiss the shell. */
  dismissible?: boolean
  /** Called when a dismissal attempt is blocked. */
  onClosePrevent?: () => void
  /** Whether body scroll should be locked while the shell is present. */
  preventScroll?: boolean
  /** Whether to render the overlay element. */
  overlay?: boolean
  /** Trigger content rendered inside the opener wrapper. */
  trigger?: JSX.Element
  /** Modal content rendered inside the content surface. */
  content?: MaybeRenderProp<ModalContentContext>
  /** Slot-based class overrides for the trigger, overlay, and content elements. */
  classes?: SlotClasses<ModalSlot>
  /** Slot-based style overrides for the trigger, overlay, and content elements. */
  styles?: SlotStyles<ModalSlot>
  /** Additional attributes applied to the content element. */
  contentAttributes?: Record<string, string | number | boolean | undefined>
  /** Id of the label element for the content. */
  ariaLabelledBy?: string
  /** Id of the description element for the content. */
  ariaDescribedBy?: string
}

export function Modal(props: ModalProps): JSX.Element {
  const rootId = useId(() => props.id, 'modal')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })

  const [triggerElement, setTriggerElement] = createSignal<HTMLSpanElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const dismissible = createMemo(() => props.dismissible ?? true)
  const dismissEntry = {
    contentElement,
    triggerElement,
  }

  let capturedTrigger: HTMLSpanElement | undefined

  function updateOpen(nextOpen: boolean): void {
    if (nextOpen === !!open()) {
      return
    }

    setOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  function onContentKeyDown(event: KeyboardEvent): void {
    trapFocusInContainer(event, contentElement())
  }

  const resolvedContent = createMemo(() =>
    resolveRenderProp(props.content, {
      close: () => updateOpen(false),
    }),
  )

  const overlayPresence = useTransitionPresence({
    open: () => Boolean(open() && props.overlay),
  })
  const contentPresence = useTransitionPresence({
    open: () => Boolean(open() && resolvedContent()),
  })
  const isPresent = createMemo(() => overlayPresence.present() || contentPresence.present())

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
      if (contentElement()?.contains(target)) {
        return true
      }

      if (triggerElement()?.contains(target)) {
        return true
      }

      return isInsideDescendantOverlay(dismissEntry, target)
    }

    const onDocumentPointerDown = (event: PointerEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(dismissEntry)) {
        return
      }

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
    }

    const onDocumentFocusIn = (event: FocusEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(dismissEntry)) {
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
      if (event.key !== 'Escape') {
        return
      }

      if (!isTopOverlay(dismissEntry)) {
        return
      }

      if (event.defaultPrevented) {
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

  function renderContent(content: () => JSX.Element): JSX.Element {
    return (
      <Show when={contentPresence.present()}>
        <div
          {...props.contentAttributes}
          {...contentPresence.dataAttrs()}
          ref={(element) => {
            setContentElement(element)
            contentPresence.setElement(element)
          }}
          id={contentId()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.ariaLabelledBy}
          aria-describedby={props.ariaDescribedBy}
          tabIndex={-1}
          data-slot="content"
          style={props.styles?.content}
          class={cn(props.classes?.content)}
          onKeyDown={onContentKeyDown}
        >
          {content()}
        </div>
      </Show>
    )
  }

  return (
    <>
      <Show when={props.trigger}>
        <span
          ref={setTriggerElement}
          tabIndex={-1}
          data-slot="trigger"
          style={props.styles?.trigger}
          class={cn('outline-none', props.classes?.trigger)}
          onClick={() => {
            updateOpen(true)
          }}
        >
          {props.trigger}
        </span>
      </Show>

      <Show when={isPresent()}>
        <Portal>
          <Show
            when={props.overlay}
            fallback={<Show when={resolvedContent()}>{(content) => renderContent(content)}</Show>}
          >
            <Show when={overlayPresence.present() || contentPresence.present()}>
              <div
                data-slot="overlay"
                {...overlayPresence.dataAttrs()}
                ref={(element) => {
                  overlayPresence.setElement(element)
                }}
                style={props.styles?.overlay}
                class={cn(props.classes?.overlay)}
              >
                <Show when={resolvedContent()}>{(content) => renderContent(content)}</Show>
              </div>
            </Show>
          </Show>
        </Portal>
      </Show>
    </>
  )
}
