import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'
/**
 * Accessible title of the surrounding `Sheet.Content`; its `id` is wired to the surface's
 * `aria-labelledby` unless `Content` has its own `aria-label`. Place it inside `Sheet.Content`,
 * usually within `Sheet.Header`. Renders an `h2` by default; pass `as` to change the element.
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
 *     </Sheet.Header>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function SheetTitle<T extends ValidComponent = 'h2'>(
  props: SheetT.TitleProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style', 'id')
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const sheet = useSheetContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const {
    slots: { title: titleSlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'title',
    context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="sheet-title"
      {...titleSlot}
      {...(rest as any)}
      id={id()}
    />
  )
}
