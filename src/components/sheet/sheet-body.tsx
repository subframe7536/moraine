import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetBody<T extends ValidComponent = 'div'>(
  props: SheetT.BodyProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const sheet = useSheetContext()
  const content = useSheetContent()
  const {
    slots: { body: bodySlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'body',
    data: { body: sheetDataAttributes.body({ header: content.hasHeader }) },
    context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
  })
  return <Dynamic component={local.as ?? 'div'} data-slot="sheet-body" {...bodySlot} {...rest} />
}
