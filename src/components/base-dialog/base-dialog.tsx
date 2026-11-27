import type { JSX } from '@solidjs/web'
import { createEffect, createMemo, createSignal, untrack } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createEventListenerMap } from '../../shared/event-listener'
import { createTransitionPresence } from '../../shared/transition-presence'
import { createId } from '../../shared/utils'
import { acquireAriaHideOutside } from '../shared/overlay/aria-hide'
import { containsComposed, getActiveElement, isHTMLElement, isNode } from '../shared/overlay/dom'
import {
  focusContent,
  focusTrigger,
  focusWithoutScrolling,
  resolveFocusTarget,
} from '../shared/overlay/focus'
import { useOverlayInteraction } from '../shared/overlay/interaction'
import { acquireBodyScrollLock } from '../shared/overlay/scroll-lock'

import { BaseDialogClose } from './base-dialog-close'
import { BaseDialogContent } from './base-dialog-content'
import { BaseDialogProvider } from './base-dialog-context'
import type { BaseDialogContext } from './base-dialog-context'
import { BaseDialogOverlay } from './base-dialog-overlay'
import { BaseDialogPortal } from './base-dialog-portal'
import { BaseDialogTrigger } from './base-dialog-trigger'
import type { BaseDialogProps } from './base-dialog.types'
/**
 * Low-level modal primitive that renders no element and shares open state, focus containment, and
 * dismissal between its parts. Use `BaseDialog` when you compose the trigger, backdrop, and content
 * yourself; use `Dialog` for a structured title, description, body, and footer, `Sheet` for a
 * drawer from a viewport edge, and `Popover` for anchored interactive content. Open state is
 * uncontrolled by default (`defaultOpen`) or controlled with `open` and `onOpenChange`.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Overlay />
 *     <BaseDialog.Content aria-label="Details">
 *       Modal content
 *       <BaseDialog.Close as={Button}>Close</BaseDialog.Close>
 *     </BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialog(props: BaseDialogProps): JSX.Element {
  const rootId = createId(() => props.id, 'base-dialog')
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
  const closeOnOutsideClick = () => props.closeOnOutsideClick !== false
  const closeOnEscape = () => props.closeOnEscape !== false
  // Plain accessor (not a memo) so post-disposal checks in `onDeactivate` see the cleared
  // `contentElement()` instead of a disposed memo's stale cached `true`.
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
    props.onClosePrevented?.()
  }

  createEffect(
    () => open() && isPresent(),
    (active) => {
      if (active) {
        hadOpenContent = true
      }
    },
  )

  const scrollLockTarget = createMemo(
    () => ({
      content: isPresent() ? contentElement() : undefined,
      preventScroll: props.preventScroll ?? isModal(),
      scrollableOverlay: overlayScroll(),
    }),
    {
      equals: (prev, next) =>
        prev.content === next.content &&
        prev.preventScroll === next.preventScroll &&
        prev.scrollableOverlay === next.scrollableOverlay,
    },
  )

  createEffect(
    scrollLockTarget,
    ({ content: currentContent, preventScroll, scrollableOverlay }) => {
      if (!currentContent || !preventScroll) {
        return
      }
      const scrollContainer = currentContent.parentElement
      const releaseScrollLock = acquireBodyScrollLock(
        scrollableOverlay && scrollContainer ? scrollContainer : currentContent,
      )
      return releaseScrollLock
    },
  )

  createEffect(triggerElement, (trigger) => {
    if (!trigger) {
      return
    }
    return createEventListenerMap(trigger, {
      pointerdown: (event) => {
        pendingOpenInteraction = event.pointerType === 'touch' ? 'touch' : null
      },
      keydown: () => {
        pendingOpenInteraction = null
      },
    })
  })

  const modalContent = createMemo(() => (isPresent() && isModal() ? contentElement() : undefined))

  createEffect(modalContent, (currentContent) => {
    if (!currentContent) {
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

    return () => {
      active = false
      release?.()
    }
  })

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
    () => [isModal(), isPresent() ? contentElement() : undefined] as const,
    ([modal, currentContent]) => {
      if (currentContent) {
        syncModalRestoreFocus(modal, currentContent.ownerDocument)
      }
    },
  )

  useOverlayInteraction({
    enabled: isPresent,
    contentElement,
    triggerElement,
    // Initial activation capture when the overlay opens and enters the stack.
    onActivate: (context) => {
      restoreFocusOnDeactivate = false
      if (context.entry.ownerDocument) {
        syncModalRestoreFocus(untrack(isModal), context.entry.ownerDocument)
      }
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
    onPointerOutside: (event) => requestDismiss(event, isModal(), closeOnOutsideClick()),
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

  const context: BaseDialogContext = {
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
    open,
    presence: {
      dataAttrs: presence.dataAttrs,
      present: presence.present,
      // Untracked surfaces let the presence end on close without waiting for an animation.
      registerElement: (element) =>
        untrack(transition) ? presence.registerElement(element) : () => undefined,
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
    mount: () => props.mount,
  }

  return <BaseDialogProvider value={context}>{props.children}</BaseDialogProvider>
}

BaseDialog.Content = BaseDialogContent
BaseDialog.Overlay = BaseDialogOverlay
BaseDialog.Portal = BaseDialogPortal
BaseDialog.Trigger = BaseDialogTrigger
BaseDialog.Close = BaseDialogClose
