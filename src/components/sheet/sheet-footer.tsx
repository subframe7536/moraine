import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetFooter<T extends ValidComponent = 'div'>(
  props: SheetT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const sheet = useSheetContext()
  const content = useSheetContent()
  const { slots } = useRecipe(sheetRecipe, local, {
    slot: 'footer',
    contextVariants: () => content.variants,
    contextSlots: () => sheet.slotOverrides,
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="sheet-footer" {...rest} {...slots.footer} />
  )
}
