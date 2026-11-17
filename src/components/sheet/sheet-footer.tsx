import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

/**
 * Action area at the end of `Sheet.Content`, below `Sheet.Body`, typically holding buttons such as
 * `Sheet.Close`. Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Settings">
 *     <Sheet.Body>Preferences</Sheet.Body>
 *     <Sheet.Footer>
 *       <Sheet.Close as={Button}>Done</Sheet.Close>
 *     </Sheet.Footer>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function SheetFooter<T extends ValidComponent = 'div'>(
  props: SheetT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const sheet = useSheetContext()
  const content = useSheetContent()
  const {
    slots: { footer: footerSlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'footer',
    context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="sheet-footer" {...footerSlot} {...rest} />
  )
}
