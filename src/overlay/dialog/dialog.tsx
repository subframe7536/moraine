import type { JSX } from 'solid-js'

import { ModalInternal } from '../modal/modal'

import { DialogBody } from './dialog-body'
import { DialogClose } from './dialog-close'
import { DialogContent } from './dialog-content'
import { DialogDescription } from './dialog-description'
import { DialogFooter } from './dialog-footer'
import { DialogHeader } from './dialog-header'
import { DialogTitle } from './dialog-title'
import { DialogTrigger } from './dialog-trigger'
import type { DialogProps } from './dialog.types'

/** Dialog state and presentation, sharing the Modal root context. */
export function Dialog(props: DialogProps): JSX.Element {
  return <ModalInternal kind="dialog" {...props} />
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Header = DialogHeader
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Body = DialogBody
Dialog.Footer = DialogFooter
Dialog.Close = DialogClose
