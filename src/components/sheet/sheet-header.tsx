import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

function createSheetHeader(headerKind: 'explicit' | 'shorthand') {
  return function SheetHeader<T extends ValidComponent = 'div'>(
    props: SheetT.HeaderProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const sheet = useSheetContext()
    const content = useSheetContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const {
      slots: { header: headerSlot },
    } = useRecipe(sheetRecipe, local, {
      slot: 'header',
      context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
    })
    return (
      <Dynamic component={local.as ?? 'div'} data-slot="sheet-header" {...headerSlot} {...rest} />
    )
  }
}

export const SheetHeader: <T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createSheetHeader('explicit')

export const SheetShorthandHeader: <T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createSheetHeader('shorthand')
