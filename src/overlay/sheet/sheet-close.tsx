import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import type { SheetT } from './sheet.types'

export function SheetClose<T extends ValidComponent = 'button'>(
  props: SheetT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close {...props} data-slot="sheet-close" />
}
