import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useSheetContent, useSheetContext } from './sheet-context'
import { sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'
/**
 * Supporting text of the surrounding `Sheet.Content`; its `id` is wired to the surface's
 * `aria-describedby`. Place it inside `Sheet.Content`, usually within `Sheet.Header` below
 * `Sheet.Title`. Renders a `p` by default; pass `as` to change the element.
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
export function SheetDescription<T extends ValidComponent = 'p'>(
  props: SheetT.DescriptionProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style', 'id')
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const sheet = useSheetContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const {
    slots: { description: descriptionSlot },
  } = useRecipe(sheetRecipe, local, {
    slot: 'description',
    context: () => ({ variants: content.variants, ...sheet.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => local.as ?? 'p')
  return (
    <Root
      data-slot="sheet-description"
      {...descriptionSlot}
      {...(rest as Record<string, unknown>)}
      id={id()}
    />
  )
}
