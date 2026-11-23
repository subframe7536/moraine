import type { JSX } from '@solidjs/web'
import { merge, omit } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { pick } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'
import { BASE_DIALOG_ROOT_KEYS } from '../base-dialog/base-dialog-context'

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
/**
 * Labeled modal task with an optional title, description, body, and footer. Pass `title` and
 * `description` to `Dialog.Content` for the default header, or compose `Dialog.Header`, `Dialog.Title`,
 * and `Dialog.Description` yourself. Use `AlertDialog` for confirmations, `Sheet` or `Drawer` for edge
 * panels, and `BaseDialog` for a bare modal without dialog presentation.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings" description="Update your account.">
 *     <Dialog.Body>Preferences</Dialog.Body>
 *     <Dialog.Footer>
 *       <Dialog.Close as={Button}>Done</Dialog.Close>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function Dialog(props: DialogProps): JSX.Element {
  const modalProps = pick(props, ...BASE_DIALOG_ROOT_KEYS)
  const dialogProps = omit(props, ...BASE_DIALOG_ROOT_KEYS)
  const context: DialogContextValue = merge(dialogProps, {
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <DialogProvider value={context}>
      <BaseDialog {...modalProps} />
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
