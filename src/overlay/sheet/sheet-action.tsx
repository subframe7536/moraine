import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useSheetContent } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetAction<T extends ValidComponent = 'div'>(
  props: SheetT.ActionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useSheetContent()
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'action',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="sheet-action"
      attributes={rest}
      binding={resolved.styles.action}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
