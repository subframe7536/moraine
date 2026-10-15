import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { Modal } from '../modal/modal'
import { MODAL_ROOT_KEYS } from '../modal/modal-context'

import { DialogBody } from './dialog-body'
import { DialogClose } from './dialog-close'
import { DialogContent } from './dialog-content'
import type { DialogContextValue } from './dialog-context'
import { DialogProvider } from './dialog-context'
import { DialogDescription } from './dialog-description'
import { DialogFooter } from './dialog-footer'
import { DialogHeader } from './dialog-header'
import { DialogTitle } from './dialog-title'
import { DialogTrigger } from './dialog-trigger'
import type { DialogProps } from './dialog.types'

/** Dialog state and presentation, sharing the Modal root context. */
export function Dialog(props: DialogProps): JSX.Element {
  const [modalProps, dialogProps] = splitProps(props, MODAL_ROOT_KEYS)
  const context: DialogContextValue = mergeProps(dialogProps, {
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <DialogProvider value={context}>
      <Modal {...modalProps} />
    </DialogProvider>
  )
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Header = DialogHeader
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Body = DialogBody
Dialog.Footer = DialogFooter
Dialog.Close = DialogClose
