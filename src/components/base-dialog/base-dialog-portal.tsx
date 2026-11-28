import type { JSX } from '@solidjs/web'
import { Portal } from '@solidjs/web'
import { Show } from 'solid-js'

import { useBaseDialogContext } from './base-dialog-context'
import type { BaseDialogT } from './base-dialog.types'
/**
 * Portals the `BaseDialog` overlay and content together while the modal is open and keeps them mounted
 * through exit animations. Place `BaseDialog.Overlay` and `BaseDialog.Content` inside it. It renders no
 * element of its own; it mounts into the trigger's document body unless `mount` is set here or on
 * `BaseDialog`.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Overlay />
 *     <BaseDialog.Content aria-label="Details">Modal content</BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialogPortal(props: BaseDialogT.PortalProps): JSX.Element {
  const context = useBaseDialogContext()

  return (
    <Show when={context.presence.present()}>
      {(_present) => (
        <Portal
          mount={
            (props.mount ??
              context.mount() ??
              context.triggerElement()?.ownerDocument.body) as Element
          }
        >
          {props.children}
        </Portal>
      )}
    </Show>
  )
}
