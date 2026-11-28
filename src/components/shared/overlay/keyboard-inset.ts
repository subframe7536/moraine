import type { Accessor } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'

import { attachEventListener, attachEventListenerMap } from '../../../shared/event-listener'

import { getActiveElement } from './dom'
/**
 * Tracks the on-screen keyboard inset below the visual viewport while `open`
 * and `content` are set, and keeps the focused element inside it visible.
 */
export function createKeyboardInset(
  open: Accessor<boolean>,
  content: Accessor<HTMLElement | undefined>,
): Accessor<number> {
  const [keyboardInset, setKeyboardInset] = createSignal(0)

  createEffect(
    () => [open(), content()],
    ([isOpen, contentElement]) => {
      if (!isOpen || !contentElement) {
        return
      }

      const surface = contentElement
      const ownerWindow = surface.ownerDocument.defaultView
      if (!ownerWindow?.visualViewport) {
        return
      }

      const view = ownerWindow
      const keyboardViewport = ownerWindow.visualViewport
      function update(): void {
        const inset = Math.max(
          0,
          Math.round(view.innerHeight - keyboardViewport.height - keyboardViewport.offsetTop),
        )
        setKeyboardInset(inset)
        if (inset <= 0) {
          return
        }

        const active = getActiveElement(surface.ownerDocument)
        if (active instanceof view.HTMLElement && surface.contains(active)) {
          active.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
      }

      update()
      const detachViewport = attachEventListenerMap(keyboardViewport, {
        resize: update,
        scroll: update,
      })
      const detachView = attachEventListener(view, 'resize', update)
      return () => {
        detachViewport()
        detachView()
        setKeyboardInset(0)
      }
    },
  )

  return keyboardInset
}
