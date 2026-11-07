import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import type { DrawerT } from './drawer.types'

export function DrawerClose<T extends ValidComponent = 'button'>(
  props: DrawerT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close data-slot="drawer-close" {...props} />
}
