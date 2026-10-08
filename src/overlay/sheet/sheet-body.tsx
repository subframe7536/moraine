import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useSheetContent } from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetBody<T extends ValidComponent = 'div'>(
  props: SheetT.BodyProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useSheetContent()
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'body',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  const bodyAttrs = sheetDataAttributes.body({ header: content.hasHeader })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="sheet-body"
      attributes={rest}
      additionalAttributes={bodyAttrs}
      binding={resolved.styles.body}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
