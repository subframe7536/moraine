import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import type { DialogT } from './dialog.types'

export function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close {...props} data-slot="dialog-close" />
}
