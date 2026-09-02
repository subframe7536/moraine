import type { Accessor } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'

import { useEventListenerMap } from '../../shared/use-event-listener'

import { isInsideOverlayLayer, isTopOverlay, pushOverlayLayer } from './overlay-stack'
import type { OverlayStackEntry } from './overlay-stack'
import { createCompositionState, createOutsidePressHandlers, isComposingKeyEvent } from './utils'

export interface OverlayInteractionContext {
  entry: OverlayStackEntry
  isInside: (target: Node) => boolean
  isTop: () => boolean
}

export interface OverlayInteractionOptions {
  containsTarget?: (target: Node) => boolean
  contentElement?: Accessor<HTMLElement | undefined>
  enabled: Accessor<boolean>
  onActivate?: (context: OverlayInteractionContext) => void
  onDeactivate?: (context: OverlayInteractionContext) => void
  onEscape?: (event: KeyboardEvent, context: OverlayInteractionContext) => void
  onFocusInside?: (event: FocusEvent, context: OverlayInteractionContext) => void
  onFocusOutside?: (event: FocusEvent, context: OverlayInteractionContext) => void
  onPointerDownInside?: (event: PointerEvent, context: OverlayInteractionContext) => void
  onPointerOutside?: (event: PointerEvent, context: OverlayInteractionContext) => void
  outsidePressEvent?: 'pointerdown' | 'tap'
  requireContent?: boolean
  triggerElement?: Accessor<HTMLElement | undefined>
}

/**
 * Owns overlay stack registration and normalized document interactions while
 * leaving component-specific dismissal and focus semantics to each consumer.
 */
export function useOverlayInteraction(options: OverlayInteractionOptions): void {
  createEffect(() => {
    if (!options.enabled() || typeof document === 'undefined') {
      return
    }

    if (options.requireContent && !options.contentElement?.()) {
      return
    }

    const entry: OverlayStackEntry = {
      contentElement: options.contentElement ?? (() => undefined),
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
      onPress: (event) => options.onPointerOutside?.(event, context),
    })

    options.onActivate?.(context)

    const onDocumentPointerDown = (event: PointerEvent): void => {
      const target = event.target
      const pathIsInside = event
        .composedPath()
        .some((pathTarget) => pathTarget instanceof Node && isInside(pathTarget))
      if (target instanceof Node && (isInside(target) || pathIsInside)) {
        options.onPointerDownInside?.(event, context)
        return
      }

      if (options.outsidePressEvent === 'pointerdown') {
        if (context.isTop()) {
          options.onPointerOutside?.(event, context)
        }
        return
      }

      outsidePress.pointerdown(event)
    }
    const onDocumentFocusIn = (event: FocusEvent): void => {
      const target = event.target
      if (!(target instanceof Node) || !context.isTop()) {
        return
      }

      if (isInside(target)) {
        options.onFocusInside?.(event, context)
        return
      }

      options.onFocusOutside?.(event, context)
    }
    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || isComposingKeyEvent(event, composition) || !context.isTop()) {
        return
      }

      options.onEscape?.(event, context)
    }

    useEventListenerMap(document, {
      pointerdown: onDocumentPointerDown,
      pointermove: outsidePress.pointermove,
      pointerup: outsidePress.pointerup,
      pointercancel: outsidePress.pointercancel,
      focusin: onDocumentFocusIn,
      keydown: onDocumentKeyDown,
      compositionstart: composition.onCompositionStart,
      compositionend: composition.onCompositionEnd,
    })

    onCleanup(() => {
      options.onDeactivate?.(context)
      release()
    })
  })
}
