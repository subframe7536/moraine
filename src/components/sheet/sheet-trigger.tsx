import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import { useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

/**
 * Element that opens the surrounding `Sheet`. Renders a `button`; pass `as` to render another
 * component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Details" />
 * </Sheet>
 * ```
 */
export function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const sheet = useSheetContext()
  const [local, rest] = splitProps(props as SheetT.TriggerProps, ['class', 'style'])
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'trigger',
    context: () => sheet.slotOverrides,
  })
  return <Modal.Trigger data-slot="sheet-trigger" {...triggerSlot} {...rest} />
}
