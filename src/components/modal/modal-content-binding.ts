import type { JSX } from 'solid-js'
import { onCleanup } from 'solid-js'

import { callHandler, callRef } from '../../shared/utils'
import { containFocusInContainer } from '../shared/overlay/utils'

import type { ModalContext } from './modal-context'

export interface ModalContentBindingOptions {
  ref?: () => ((element: HTMLDivElement) => void) | HTMLDivElement | undefined
  onKeyDown?: () => JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> | undefined
}

/** Reusable DOM wiring for modal content surfaces: presence ref registration and focus trapping. */
export function createModalContentBinding(
  context: ModalContext,
  options: ModalContentBindingOptions = {},
) {
  return {
    ref: (element: HTMLDivElement) => {
      const unregister = context.presence.registerElement(element)
      context.setContentElement(element)
      callRef(options.ref?.(), element)
      onCleanup(() => {
        unregister()
        if (context.contentElement() === element) {
          context.setContentElement(undefined)
        }
      })
    },
    onKeyDown: (event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
      callHandler(event, options.onKeyDown?.())
      if (event.defaultPrevented) {
        return
      }
      if (context.isModal()) {
        containFocusInContainer(event, context.contentElement())
      }
    },
    ariaModal: () => (context.isModal() ? ('true' as const) : undefined),
    tabIndex: -1 as const,
  }
}
