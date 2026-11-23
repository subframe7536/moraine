import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'
import { BaseDialog } from '../base-dialog/base-dialog'

import type { DialogT } from './dialog.types'
/**
 * Explicit control that closes the surrounding `Dialog`. Place it anywhere inside the `Dialog`
 * root, typically in `Dialog.Footer`; it is separate from the corner close button that
 * `Dialog.Content` renders automatically (see `closable`). Renders a `button`; pass `as` to render
 * another component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings">
 *     <Dialog.Footer>
 *       <Dialog.Close as={Button}>Done</Dialog.Close>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  return <BaseDialog.Close data-slot="dialog-close" {...props} />
}
