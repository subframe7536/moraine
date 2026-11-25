import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'
function createSheetHeader(headerKind: 'explicit' | 'shorthand') {
  return function SheetHeader<T extends ValidComponent = 'div'>(
    props: SheetT.HeaderProps<T>,
  ): JSX.Element {
    const local = pick(props, 'as', 'class', 'style')
    const rest = omit(props, 'as', 'class', 'style')
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
    const Root = dynamic<ValidComponent>(() => local.as ?? 'div')
    return <Root data-slot="sheet-header" {...headerSlot} {...(rest as any)} />
  }
}

/**
 * Layout group for `Sheet.Title` and `Sheet.Description` inside `Sheet.Content`. Placing it
 * explicitly replaces the header that `Content` generates from its `title` and `description` props.
 * Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content>
 *     <Sheet.Header>
 *       <Sheet.Title>Settings</Sheet.Title>
 *       <Sheet.Description>Update your account.</Sheet.Description>
 *     </Sheet.Header>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export const SheetHeader: <T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createSheetHeader('explicit')

export const SheetShorthandHeader: <T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createSheetHeader('shorthand')
