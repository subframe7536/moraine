import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'

import { useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'
/**
 * Element that opens the surrounding `Dialog`. Renders a `button`; pass `as` to render another
 * component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings" />
 * </Dialog>
 * ```
 */
export function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const local = pick(props as DialogT.TriggerProps, 'class', 'style')
  const rest = omit(props as DialogT.TriggerProps, 'class', 'style')
  const dialog = useDialogContext()
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(dialogRecipe, local, {
    slot: 'trigger',
    context: () => dialog.slotOverrides,
  })
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...triggerSlot} {...rest} />
}
