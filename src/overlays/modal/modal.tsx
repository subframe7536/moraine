import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js'

import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { useId } from '../../shared/utils.ts'
import { useOverlayInteraction } from '../base/interaction.ts'
import {
  acquireAriaHideOutside,
  acquireBodyScrollLock,
  focusContent,
  focusWithoutScrolling,
  focusTrigger,
} from '../base/utils.ts'

import { ModalClose } from './modal-close.tsx'
import { ModalContent } from './modal-content.tsx'
import { ModalProvider } from './modal-context.ts'
import { ModalTrigger } from './modal-trigger.tsx'
import type { ModalProps } from './modal.types.ts'
export type { ModalProps, ModalT } from './modal.types.ts'

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

  return <ModalProvider value={context}>{props.children}</ModalProvider>
}

Modal.Content = ModalContent
Modal.Trigger = ModalTrigger
Modal.Close = ModalClose
