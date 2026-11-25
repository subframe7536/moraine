import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'
/**
 * Main region of `Sheet.Content`, placed between the header and footer. Scrolls when its content
 * overflows. Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Settings">
 *     <Sheet.Body>Preferences</Sheet.Body>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function SheetBody<T extends ValidComponent = 'div'>(
  props: SheetT.BodyProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style')
  const rest = omit(props, 'as', 'class', 'style')
  const sheet = useSheetContext()
  const content = useSheetContent()
  const {
    slots: { body: bodySlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'body',
    data: { body: sheetDataAttributes.body({ header: content.hasHeader }) },
    context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => local.as ?? 'div')
  return <Root data-slot="sheet-body" {...bodySlot} {...(rest as Record<string, unknown>)} />
}
