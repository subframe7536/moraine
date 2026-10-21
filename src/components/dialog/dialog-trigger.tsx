import type { JSX } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import { useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const dialog = useDialogContext()
  const { slots } = useRecipe(dialogRecipe, props, {
    slot: 'trigger',
    contextSlots: () => dialog.slotOverrides,
  })
  return <Modal.Trigger data-slot="dialog-trigger" {...props} {...slots.trigger} />
}
