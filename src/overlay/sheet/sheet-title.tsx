import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../base/content-anatomy'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useSheetContent } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetTitle<T extends ValidComponent = 'h2'>(
  props: SheetT.TitleProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="h2"
      slot="sheet-title"
      attributes={rest}
      binding={resolved.styles.title}
      id={id()}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
