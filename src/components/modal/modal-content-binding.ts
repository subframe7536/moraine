import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'

import { bindElement, publishElement } from '../../shared/element-binding'
import { callHandler, callRef } from '../../shared/utils'
import { containFocusInContainer } from '../shared/overlay/utils'

import type { ModalContext } from './modal-context'

export interface ModalContentBindingOptions {
  ref?: () => ((element: HTMLDivElement) => void) | HTMLDivElement | undefined
  onKeyDown?: () => JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> | undefined
}

/**
 * Reusable DOM wiring for modal content surfaces: presence registration and focus trapping.
 *
 * Call it in the owner that renders the content element, so the binding releases on unmount.
 */
export function createModalContentBinding(
  context: ModalContext,
  options: ModalContentBindingOptions = {},
) {
  const [element, setElement] = createSignal<HTMLDivElement>()
  bindElement(element, (current) => {
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
      callRef(options.ref?.(), element)
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
