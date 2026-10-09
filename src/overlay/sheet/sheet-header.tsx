import type { JSX } from 'solid-js'
import { onCleanup, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useModalContext } from '../modal/modal-context'

import { useSheetContent } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

function SheetHeaderRoot<T extends ValidComponent>(
  props: SheetT.HeaderProps<T> & { headerKind: 'explicit' | 'shorthand' },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'headerKind'])
  const family = useModalContext()
  const content = useSheetContent()
  const unregister = content.registerHeader(untrack(() => local.headerKind))
  onCleanup(unregister)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sheet-header"
      {...rest}
      {...resolved.styles.header}
    >
      {local.children}
    </Dynamic>
  )
}

export function SheetHeader<T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
): JSX.Element {
  return <SheetHeaderRoot {...props} headerKind="explicit" />
}

export function SheetShorthandHeader<T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
): JSX.Element {
  return <SheetHeaderRoot {...props} headerKind="shorthand" />
}
