import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import type { SheetT } from './sheet.types'

/**
 * Control that closes the surrounding `Sheet`. Place it inside `Sheet.Content` (or anywhere under
 * the `Sheet` root). Renders a `button`; pass `as` to render another component such as `Button`. It
 * is separate from the automatic corner close button that `closable` on the root controls.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Details">
 *     <Sheet.Close as={Button}>Cancel</Sheet.Close>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function SheetClose<T extends ValidComponent = 'button'>(
  props: SheetT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close data-slot="sheet-close" {...props} />
}
