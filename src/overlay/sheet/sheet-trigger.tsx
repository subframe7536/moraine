import type { JSX } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'
import { useModalContext } from '../modal/modal-context'

import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const family = useModalContext()
  const resolved = createStyles(sheetRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}
