import type { JSX } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import { useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const sheet = useSheetContext()
  const { slots } = useRecipe(sheetRecipe, props, {
    slot: 'trigger',
    contextSlots: () => sheet.slotOverrides,
  })
  return <Modal.Trigger data-slot="sheet-trigger" {...props} {...slots.trigger} />
}
