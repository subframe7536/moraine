import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js'

import { dataSlotName } from '../../shared/data-slot.ts'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { useId } from '../../shared/utils'
import { containsComposed, getActiveElement, isHTMLElement, isNode } from '../base/dom'
import { useOverlayInteraction } from '../base/interaction'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusWithoutScrolling,
  focusTrigger,
} from '../base/utils'

import { ModalClose } from './modal-close'
import { ModalContent } from './modal-content'
import { ModalProvider } from './modal-context'
import { ModalOverlay } from './modal-overlay'
import { ModalPortal } from './modal-portal'
import { ModalTrigger } from './modal-trigger'
import type { ModalProps } from './modal.types'

/** Low-level modal primitives for composing custom dialog surfaces. */
export function Modal(props: ModalProps): JSX.Element {
  return <ModalRoot {...props} slotOwner="modal" />
}

export function ModalRoot(props: ModalProps & { slotOwner: string }): JSX.Element {
  const rootId = useId(() => props.id, 'modal')
  const contentId = createMemo(() => `${rootId()}-content`)
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const presence = useTransitionPresence({ open })
  const [contentRegistrations, setContentRegistrations] = createSignal<Map<number, () => boolean>>(
    new Map(),
  )
  let nextContentRegistrationId = 0
  const dismissible = () => props.dismissible ?? true
  const contentMounted = () => contentRegistrations().size > 0
  const isPresent = createMemo(() => contentMounted() && presence.present())
  const shouldContainFocus = () => {
    for (const trapFocus of contentRegistrations().values()) {
      if (trapFocus()) {
        return true
      }
    }
    return false
  }
  const isModal = createMemo(shouldContainFocus)
  let capturedTrigger: HTMLElement | undefined
  let capturedRestoreTarget: HTMLElement | undefined
  let lastFocusedElement: HTMLElement | undefined
  let restoreFocusOnDeactivate = false
  let hadOpenContent = false
  let closeCycleActive = false

  const updateOpen = (nextOpen: boolean): void => {
    if (nextOpen === open()) {
      return
    }

    setOpen(nextOpen)
    props.onOpenChange?.(nextOpen)
  }

  const requestDismiss = (event: Event, preventDefault: boolean): void => {
    if (event.defaultPrevented) {
      return
    }
    if (preventDefault) {
      event.preventDefault()
    }
    if (dismissible()) {
      updateOpen(false)
    } else {
      props.onClosePrevent?.()
    }
  }

  createEffect(
    on([open, contentMounted, presence.present], ([isOpen, mounted, present]) => {
      if (isOpen) {
        if (mounted && present) {
          hadOpenContent = true
        }
        closeCycleActive = false
        return
      }

      if (hadOpenContent) {
        closeCycleActive = true
      }

      if (closeCycleActive && !present) {
        closeCycleActive = false
        hadOpenContent = false
        props.onExitComplete?.()
      }
    }),
  )

  createEffect(
    on([isPresent, isModal, contentElement], ([present, modal, currentContent]) => {
      if (!present || !modal || !currentContent || typeof document === 'undefined') {
        return
      }
      const preventScroll = props.preventScroll
      const releaseScrollLock =
        preventScroll === false ? undefined : acquireBodyScrollLock(currentContent)

      let active = true
      let release: (() => void) | undefined
      queueMicrotask(() => {
        if (active && currentContent.isConnected) {
          release = acquireAriaHideOutside(currentContent)
          focusContent(currentContent)
        }
      })

      onCleanup(() => {
        active = false
        release?.()
        releaseScrollLock?.()
      })
    }),
  )

  useOverlayInteraction({
    enabled: isPresent,
    contentElement,
    triggerElement,
    onActivate: (context) => {
      restoreFocusOnDeactivate = shouldContainFocus()
      if (restoreFocusOnDeactivate) {
        capturedTrigger = untrack(triggerElement)
        const activeElement = getActiveElement(context.entry.ownerDocument!)
        capturedRestoreTarget =
          capturedTrigger ??
          (isHTMLElement(activeElement) && activeElement !== context.entry.ownerDocument?.body
            ? activeElement
            : undefined)
      } else {
        capturedTrigger = undefined
        capturedRestoreTarget = undefined
      }
      lastFocusedElement = undefined
    },
    onPointerDownInside: (event, context) => {
      if (!shouldContainFocus()) {
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
              focusContent(currentContent)
            }
          })
        })
      }
    },
    onPointerOutside: (event) => requestDismiss(event, shouldContainFocus()),
    onFocusInside: (event) => {
      const target = event.target
      const currentContent = contentElement()
      if (isHTMLElement(target) && currentContent && containsComposed(currentContent, target)) {
        lastFocusedElement = target
      }
    },
    onFocusOutside: () => {
      if (!shouldContainFocus()) {
        return
      }
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
    onEscape: (event) => requestDismiss(event, true),
    onDeactivate: () => {
      if (!restoreFocusOnDeactivate) {
        return
      }
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
    slotName: (slot: string) => dataSlotName(props.slotOwner, slot),
    get presentation() {
      return { classes: props.classes, styles: props.styles }
    },
    open,
    presence,
    contentId,
    updateOpen,
    triggerElement,
    setTriggerElement,
    contentElement,
    setContentElement,
    registerContent: (trapFocus: () => boolean) => {
      const registrationId = nextContentRegistrationId++
      let active = true
      setContentRegistrations((current) => {
        const next = new Map(current)
        next.set(registrationId, trapFocus)
        return next
      })

      return () => {
        if (!active) {
          return
        }

        active = false
        setContentRegistrations((current) => {
          const next = new Map(current)
          next.delete(registrationId)
          return next
        })
      }
    },
    isModal,
  }

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

Modal.Content = ModalContent
Modal.Overlay = ModalOverlay
Modal.Portal = ModalPortal
Modal.Trigger = ModalTrigger
Modal.Close = ModalClose
