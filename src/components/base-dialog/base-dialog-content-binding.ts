import type { JSX } from '@solidjs/web'
import { createEffect, createSignal } from 'solid-js'

import { createKeyDownHandler } from '../../shared/keyboard'
import { publishElement } from '../../shared/utils'
import { containFocusInContainer } from '../shared/overlay/focus'

import type { BaseDialogContext } from './base-dialog-context'
export interface BaseDialogContentBindingOptions {
  ref?: () => ((element: HTMLDivElement) => void) | HTMLDivElement | undefined
  onKeyDown?: () => JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> | undefined
}

/**
 * Reusable DOM wiring for modal content surfaces: presence registration and focus trapping.
 *
 * Call it in the owner that renders the content element, so the binding releases on unmount.
 */
export function createBaseDialogContentBinding(
  context: BaseDialogContext,
  options: BaseDialogContentBindingOptions = {},
) {
  const [element, setElement] = createSignal<HTMLDivElement>()
  createEffect(element, (current) => {
    if (!current) {
      return
    }
    const unpublish = publishElement(context.contentElement, context.setContentElement)(current)
    const release = context.presence.registerElement(current)
    return () => {
      release()
      unpublish()
    }
  })

  return {
    ref: (element: HTMLDivElement) => {
      setElement(element)
      const userRef = options.ref?.()
      if (typeof userRef === 'function') {
        userRef(element)
      }
    },
    onKeyDown: createKeyDownHandler<HTMLDivElement>({
      onKeyDown: () => options.onKeyDown?.(),
      onUnhandled: (event) => {
        if (context.isModal()) {
          containFocusInContainer(event, context.contentElement())
        }
      },
    }),
    ariaModal: () => (context.isModal() ? ('true' as const) : undefined),
    tabIndex: -1 as const,
  }
}
