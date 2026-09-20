import type { Accessor } from 'solid-js'
import { createEffect, on, onCleanup } from 'solid-js'

import { useEventListenerMap } from '../../shared/use-event-listener'

import { isNode } from './dom'
import { isInsideOverlayLayer, isTopOverlay, pushOverlayLayer } from './overlay-stack'
import type { OverlayStackEntry } from './overlay-stack'
import { createCompositionState, createOutsidePressHandlers, isComposingKeyEvent } from './utils'

interface SuppressedPointerClick {
  pointerId: number
  released: boolean
  target: EventTarget
  timeoutId?: ReturnType<typeof setTimeout>
}

const suppressedPointerClicks = new WeakMap<Document, SuppressedPointerClick>()
const pointerInteractionStarts = new WeakMap<Document, PointerEvent>()

function clearSuppressedPointerClick(
  ownerDocument: Document,
  suppression: SuppressedPointerClick,
): void {
  if (suppression.timeoutId !== undefined) {
    clearTimeout(suppression.timeoutId)
  }

  if (suppressedPointerClicks.get(ownerDocument) === suppression) {
    suppressedPointerClicks.delete(ownerDocument)
  }
}

function beginPointerInteraction(ownerDocument: Document, event: PointerEvent): void {
  if (pointerInteractionStarts.get(ownerDocument) === event) {
    return
  }
  pointerInteractionStarts.set(ownerDocument, event)

  const existing = suppressedPointerClicks.get(ownerDocument)
  if (existing) {
    clearSuppressedPointerClick(ownerDocument, existing)
  }
}

function suppressPointerClick(ownerDocument: Document, event: PointerEvent): void {
  if (!event.target) {
    return
  }

  const suppression: SuppressedPointerClick = {
    pointerId: event.pointerId,
    released: false,
    target: event.target,
  }
  suppressedPointerClicks.set(ownerDocument, suppression)
}

function completePointerInteraction(ownerDocument: Document, event: PointerEvent): void {
  const suppression = suppressedPointerClicks.get(ownerDocument)
  if (suppression?.pointerId === event.pointerId) {
    suppression.released = true
    // A native click immediately follows pointerup. Clear after that dispatch
    // so a canceled activation cannot leak suppression into a later overlay.
    suppression.timeoutId = setTimeout(() => {
      clearSuppressedPointerClick(ownerDocument, suppression)
    }, 0)
  }
}

function cancelPointerInteraction(ownerDocument: Document, event: PointerEvent): void {
  const suppression = suppressedPointerClicks.get(ownerDocument)
  if (suppression?.pointerId === event.pointerId) {
    clearSuppressedPointerClick(ownerDocument, suppression)
  }
}

function consumeSuppressedPointerClick(ownerDocument: Document, event: MouseEvent): boolean {
  const suppression = suppressedPointerClicks.get(ownerDocument)
  if (!suppression) {
    return false
  }

  const matches = event.detail !== 0 && suppression.released && suppression.target === event.target
  clearSuppressedPointerClick(ownerDocument, suppression)
  return matches
}

export interface OverlayInteractionContext {
  entry: OverlayStackEntry
  isInside: (target: Node) => boolean
  isTop: () => boolean
}

export interface OverlayInteractionOptions {
  containsTarget?: (target: Node) => boolean
  contentElement?: Accessor<HTMLElement | undefined>
  /** Whether this layer participates in the overlay stack and document interactions. */
  enabled: Accessor<boolean>
  onActivate?: (context: OverlayInteractionContext) => void
  onDeactivate?: (context: OverlayInteractionContext) => void
  onEscape?: (event: KeyboardEvent, context: OverlayInteractionContext) => void
  onFocusInside?: (event: FocusEvent, context: OverlayInteractionContext) => void
  onFocusOutside?: (event: FocusEvent, context: OverlayInteractionContext) => void
  onPointerDownInside?: (event: PointerEvent, context: OverlayInteractionContext) => void
  onPointerOutside?: (event: MouseEvent | PointerEvent, context: OverlayInteractionContext) => void
  requireContent?: boolean
  triggerElement?: Accessor<HTMLElement | undefined>
}

/**
 * Owns overlay stack registration and normalized document interactions while
 * leaving component-specific dismissal and focus semantics to each consumer.
 */
export function useOverlayInteraction(options: OverlayInteractionOptions): void {
  createEffect(
    on(
      () => {
        if (!options.enabled()) {
          return undefined
        }

        const contentElement = options.contentElement?.()
        if (options.requireContent && !contentElement) {
          return undefined
        }

        return (contentElement ?? options.triggerElement?.())?.ownerDocument
      },
      (ownerDocument) => {
        if (!ownerDocument) {
          return
        }

        const entry: OverlayStackEntry = {
          contentElement: options.contentElement ?? (() => undefined),
          ownerDocument,
          triggerElement: options.triggerElement ?? (() => undefined),
        }
        const release = pushOverlayLayer(entry)
        const isInside = (target: Node): boolean =>
          Boolean(options.containsTarget?.(target)) || isInsideOverlayLayer(entry, target)
        const context: OverlayInteractionContext = {
          entry,
          isInside,
          isTop: () => isTopOverlay(entry),
        }
        const composition = createCompositionState()
        const outsidePress = createOutsidePressHandlers({
          isInside,
          isEnabled: context.isTop,
          onPress: (event) => {
            suppressPointerClick(ownerDocument, event)
            options.onPointerOutside?.(event, context)
          },
        })

        options.onActivate?.(context)

        const onDocumentPointerDown = (event: PointerEvent): void => {
          beginPointerInteraction(ownerDocument, event)
          const target = event.target
          const pathIsInside = event
            .composedPath()
            .some((pathTarget) => isNode(pathTarget) && isInside(pathTarget))
          if (isNode(target) && (isInside(target) || pathIsInside)) {
            options.onPointerDownInside?.(event, context)
            return
          }

          outsidePress.pointerdown(event)
        }
        const onDocumentPointerUp = (event: PointerEvent): void => {
          outsidePress.pointerup(event)
          completePointerInteraction(ownerDocument, event)
        }
        const onDocumentPointerCancel = (event: PointerEvent): void => {
          outsidePress.pointercancel(event)
          cancelPointerInteraction(ownerDocument, event)
        }
        const onDocumentFocusIn = (event: FocusEvent): void => {
          const target = event.target
          const pathIsInside = event
            .composedPath()
            .some((pathTarget) => isNode(pathTarget) && isInside(pathTarget))
          if (!isNode(target) || !context.isTop()) {
            return
          }

          if (isInside(target) || pathIsInside) {
            options.onFocusInside?.(event, context)
            return
          }

          options.onFocusOutside?.(event, context)
        }
        const onDocumentKeyDown = (event: KeyboardEvent): void => {
          if (
            event.key !== 'Escape' ||
            isComposingKeyEvent(event, composition) ||
            !context.isTop()
          ) {
            return
          }

          options.onEscape?.(event, context)
        }
        const onDocumentClick = (event: MouseEvent): void => {
          const target = event.target
          const pathIsInside = event
            .composedPath()
            .some((pathTarget) => isNode(pathTarget) && isInside(pathTarget))
          if (
            event.defaultPrevented ||
            !isNode(target) ||
            !context.isTop() ||
            isInside(target) ||
            pathIsInside ||
            consumeSuppressedPointerClick(ownerDocument, event)
          ) {
            return
          }

          options.onPointerOutside?.(event, context)
        }

        useEventListenerMap(ownerDocument, {
          pointerdown: onDocumentPointerDown,
          pointermove: outsidePress.pointermove,
          pointerup: onDocumentPointerUp,
          pointercancel: onDocumentPointerCancel,
          click: onDocumentClick,
          focusin: onDocumentFocusIn,
          keydown: onDocumentKeyDown,
          compositionstart: composition.onCompositionStart,
          compositionend: composition.onCompositionEnd,
        })

        onCleanup(() => {
          outsidePress.dispose()
          composition.dispose()
          options.onDeactivate?.(context)
          release()
        })
      },
    ),
  )
}
