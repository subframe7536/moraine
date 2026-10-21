import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetTitle<T extends ValidComponent = 'h2'>(
  props: SheetT.TitleProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const sheet = useSheetContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const { slots } = useRecipe(sheetRecipe, local, {
    slot: 'title',
    contextVariants: () => content.variants,
    contextSlots: () => sheet.slotOverrides,
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="sheet-title"
      {...rest}
      id={id()}
      {...slots.title}
    />
  )
}
