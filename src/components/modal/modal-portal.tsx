import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/**
 * Portals the `Modal` overlay and content together while the modal is open and keeps them mounted
 * through exit animations. Place `Modal.Overlay` and `Modal.Content` inside it. It renders no
 * element of its own; it mounts into the trigger's document body unless `mount` is set here or on
 * `Modal`.
 *
 * @example
 * ```tsx
 * import { Button, Modal } from 'moraine'
 *
 * <Modal>
 *   <Modal.Trigger as={Button}>Open</Modal.Trigger>
 *   <Modal.Portal>
 *     <Modal.Overlay />
 *     <Modal.Content aria-label="Details">Modal content</Modal.Content>
 *   </Modal.Portal>
 * </Modal>
 * ```
 */
export function ModalPortal(props: ModalT.PortalProps): JSX.Element {
  const context = useModalContext()

  return (
    <Show when={context.presence.present()}>
      {(_present) => (
        <Portal
          mount={props.mount ?? context.mount() ?? context.triggerElement()?.ownerDocument.body}
        >
          {props.children}
        </Portal>
      )}
    </Show>
  )
}
