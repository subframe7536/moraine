import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

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
  const [local, rest] = splitProps(props, ['class', 'style'])
  const dialog = useDialogContext()
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(dialogRecipe, local, {
    slot: 'trigger',
    context: () => dialog.slotOverrides,
  })
  return <Modal.Trigger data-slot="dialog-trigger" {...triggerSlot} {...rest} />
}
