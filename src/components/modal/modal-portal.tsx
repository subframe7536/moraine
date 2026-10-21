import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/** Portals modal parts together while their presence cycle is active. */
export function ModalPortal(props: ModalT.PortalProps): JSX.Element {
  const context = useModalContext()

  return (
    <Show when={context.presence.present()}>
      {(_present) => (
        <Portal
          mount={
            props.mount ?? context.portalMount() ?? context.triggerElement()?.ownerDocument.body
          }
        >
          {props.children}
        </Portal>
      )}
    </Show>
  )
}
