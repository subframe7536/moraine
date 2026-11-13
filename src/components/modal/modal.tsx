import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, untrack } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createEventListenerMap } from '../../shared/event-listener'
import { createTransitionPresence } from '../../shared/transition-presence'
import { createId } from '../../shared/utils'
import { acquireAriaHideOutside } from '../shared/overlay/aria-hide'
import { containsComposed, getActiveElement, isHTMLElement, isNode } from '../shared/overlay/dom'
import { focusContent, focusTrigger, focusWithoutScrolling } from '../shared/overlay/focus'
import { useOverlayInteraction } from '../shared/overlay/interaction'
import { acquireBodyScrollLock } from '../shared/overlay/scroll-lock'

import { ModalClose } from './modal-close'
import { ModalContent } from './modal-content'
import { ModalProvider } from './modal-context'
import type { ModalContext } from './modal-context'
import { ModalOverlay } from './modal-overlay'
import { ModalPortal } from './modal-portal'
import { ModalTrigger } from './modal-trigger'
import type { ModalProps } from './modal.types'

/** Low-level modal primitives for composing custom dialog surfaces. */
export function Modal(props: ModalProps): JSX.Element {
  const rootId = createId(() => props.id, 'modal')
  const contentId = () => `${rootId()}-content`
  const [open, updateOpen] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [overlayScroll, setOverlayScroll] = createSignal(false)
  let hadOpenContent = false
  const presence = createTransitionPresence({
    open,
    onExitComplete: () => {
      if (hadOpenContent) {
        hadOpenContent = false
        props.onExitComplete?.()
      }
    },
  })
  const closeOnOverlayClick = () => props.closeOnOverlayClick !== false
  const closeOnEscape = () => props.closeOnEscape !== false
  const isPresent = () => Boolean(contentElement() && presence.present())
  const isModal = () => props.modal !== false
  const transition = () => props.transition !== false
  let capturedTrigger: HTMLElement | undefined
  let capturedRestoreTarget: HTMLElement | undefined
  let lastFocusedElement: HTMLElement | undefined
  let restoreFocusOnDeactivate = false
  let pendingOpenInteraction: 'touch' | null = null

  const captureRestoreFocus = (ownerDocument: Document): void => {
    capturedTrigger = untrack(triggerElement)
    const activeElement = getActiveElement(ownerDocument)
    capturedRestoreTarget =
      capturedTrigger ??
      (isHTMLElement(activeElement) && activeElement !== ownerDocument.body
        ? activeElement
        : undefined)
  }

  const resolveFocusTarget = (
    target: ModalProps['initialFocus'] | ModalProps['finalFocus'],
  ): HTMLElement | undefined => {
    if (typeof target === 'function') {
      return target()
    }
    return target === false ? undefined : target
  }

  const focusInto = (content: HTMLElement | undefined, openedByTouch = false): void => {
    if (!content) {
      return
    }
    if (props.initialFocus === false) {
      return
    }

    const target = resolveFocusTarget(props.initialFocus)
    if (target) {
      focusWithoutScrolling(target)
      return
    }

    if (openedByTouch) {
      focusWithoutScrolling(content)
      return
    }

    focusContent(content)
  }

  const requestDismiss = (event: Event, preventDefault: boolean, allowed: boolean): void => {
    if (event.defaultPrevented) {
      return
    }
    if (preventDefault) {
      event.preventDefault()
    }
    if (allowed) {
      updateOpen(false)
      return
    }
    props.onClosePrevent?.()
  }

  createEffect(
    on([open, isPresent], ([isOpen, present]) => {
      if (isOpen && present) {
        hadOpenContent = true
      }
    }),
  )

  createEffect(
    on(
      [isPresent, () => props.preventScroll !== false, overlayScroll],
      ([present, preventScroll]) => {
        if (!present || !preventScroll) {
          return
        }
        const currentContent = contentElement()
        if (!currentContent) {
          return
        }
        const scrollContainer = currentContent.parentElement
        const releaseScrollLock = acquireBodyScrollLock(
          scrollContainer?.hasAttribute('data-overlay-scroll') ? scrollContainer : currentContent,
        )
        onCleanup(releaseScrollLock)
      },
    ),
  )

  createEffect(
    on(triggerElement, (trigger) => {
      if (!trigger) {
        return
      }
      createEventListenerMap(trigger, {
        pointerdown: (event) => {
          pendingOpenInteraction = event.pointerType === 'touch' ? 'touch' : null
        },
        keydown: () => {
          pendingOpenInteraction = null
        },
      })
    }),
  )

  createEffect(
    on([isPresent, isModal], ([present, modal]) => {
      const currentContent = contentElement()
      if (!present || !modal || !currentContent) {
        return
      }
      let active = true
      let release: (() => void) | undefined
      const openByTouch = pendingOpenInteraction === 'touch'
      pendingOpenInteraction = null
      queueMicrotask(() => {
        if (active && currentContent.isConnected) {
          release = acquireAriaHideOutside(currentContent)
          focusInto(currentContent, openByTouch)
        }
      })

      onCleanup(() => {
        active = false
        release?.()
      })
    }),
  )

  function syncModalRestoreFocus(modal: boolean, ownerDocument: Document) {
    if (modal && !restoreFocusOnDeactivate) {
      restoreFocusOnDeactivate = true
      captureRestoreFocus(ownerDocument)
    } else if (!modal) {
      restoreFocusOnDeactivate = false
      capturedTrigger = undefined
      capturedRestoreTarget = undefined
    }
  }

  // Handles dynamic changes to the `modal` prop while the overlay is already present.
  createEffect(
    on(isModal, (modal) => {
      const currentContent = contentElement()
      if (!isPresent() || !currentContent) {
        return
      }
      syncModalRestoreFocus(modal, currentContent.ownerDocument)
    }),
  )

  useOverlayInteraction({
    enabled: isPresent,
    contentElement,
    triggerElement,
    // Initial activation capture when the overlay opens and enters the stack.
    onActivate: (context) => {
      syncModalRestoreFocus(isModal(), context.entry.ownerDocument!)
      lastFocusedElement = undefined
    },
    onPointerDownInside: (event, context) => {
      if (!isModal()) {
        return
      }
      const target = event.target
      const currentContent = contentElement()
      if (
        isNode(target) &&
        currentContent &&
        (containsComposed(currentContent, target) || event.composedPath().includes(currentContent))
      ) {
        queueMicrotask(() => {
          untrack(() => {
            if (!isPresent() || !context.isTop() || !currentContent.isConnected) {
              return
            }

            const activeElement = getActiveElement(currentContent.ownerDocument)
            if (activeElement && containsComposed(currentContent, activeElement)) {
              return
            }

            if (lastFocusedElement?.isConnected && currentContent.contains(lastFocusedElement)) {
              focusWithoutScrolling(lastFocusedElement)
            } else {
              focusInto(currentContent)
            }
          })
        })
      }
    },
    onPointerOutside: (event) => requestDismiss(event, isModal(), closeOnOverlayClick()),
    onFocusInside: (event) => {
      const target = event.target
      const currentContent = contentElement()
      if (isHTMLElement(target) && currentContent && containsComposed(currentContent, target)) {
        lastFocusedElement = target
      }
    },
    onFocusOutside: () => {
      if (!isModal()) {
        return
      }
      const currentContent = contentElement()
      queueMicrotask(() => {
        if (lastFocusedElement?.isConnected && currentContent?.contains(lastFocusedElement)) {
          focusWithoutScrolling(lastFocusedElement)
        } else {
          focusInto(currentContent)
        }
      })
    },
    onEscape: (event) => requestDismiss(event, true, closeOnEscape()),
    onDeactivate: () => {
      if (!restoreFocusOnDeactivate) {
        return
      }
      const trigger = capturedTrigger
      const restoreTarget = capturedRestoreTarget
      const finalFocus = props.finalFocus

      queueMicrotask(() => {
        untrack(() => {
          if (isPresent()) {
            return
          }

          if (finalFocus !== undefined) {
            if (finalFocus !== false) {
              focusTrigger(resolveFocusTarget(finalFocus))
            }
            return
          }

          if (focusTrigger(trigger)) {
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
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
    open,
    presence: {
      dataAttrs: presence.dataAttrs,
      present: presence.present,
      // Untracked surfaces let the presence end on close without waiting for an animation.
      registerElement: (element) =>
        transition() ? presence.registerElement(element) : () => undefined,
    },
    transition,
    contentId,
    updateOpen,
    triggerElement,
    setTriggerElement,
    contentElement,
    setContentElement,
    setOverlayScroll,
    isModal,
    portalMount: () => props.portalMount,
  }

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

Modal.Content = ModalContent
Modal.Overlay = ModalOverlay
Modal.Portal = ModalPortal
Modal.Trigger = ModalTrigger
Modal.Close = ModalClose
