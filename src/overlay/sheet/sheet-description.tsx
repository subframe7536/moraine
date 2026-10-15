import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../base/content-anatomy'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetDescription<T extends ValidComponent = 'p'>(
  props: SheetT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const sheet = useSheetContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const { slots } = useRecipe(sheetRecipe, local, {
    slot: 'description',
    contextVariants: () => content.variants,
    contextSlots: () => sheet.slotOverrides,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="sheet-description"
      {...rest}
      id={id()}
      {...slots.description}
    />
  )
}
