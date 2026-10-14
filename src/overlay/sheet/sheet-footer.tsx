import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useModalContext } from '../modal/modal-context'

import { useSheetContent } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetFooter<T extends ValidComponent = 'div'>(
  props: SheetT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useSheetContent()
  const { slots } = useRecipe(sheetRecipe, local, {
    slot: 'footer',
    contextVariants: () => content.variants,
    contextSlots: () => family.slotOverrides,
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="sheet-footer" {...rest} {...slots.footer}>
      {local.children}
    </Dynamic>
  )
}
