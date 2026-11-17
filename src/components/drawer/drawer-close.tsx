import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import type { DrawerT } from './drawer.types'

/**
 * Control that closes the surrounding `Drawer`. Place it inside `Drawer.Content` (or anywhere under
 * the `Drawer` root). Renders a `button`; pass `as` to render another component such as `Button`.
 * It is separate from the automatic corner close button that `closable` on the root controls.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content title="Details">
 *     <Drawer.Close as={Button}>Cancel</Drawer.Close>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function DrawerClose<T extends ValidComponent = 'button'>(
  props: DrawerT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close data-slot="drawer-close" {...props} />
}
