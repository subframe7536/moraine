import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'
/**
 * Secondary text that explains a `Dialog`. Place it inside `Dialog.Content`, usually within
 * `Dialog.Header` after `Dialog.Title`; its id is connected to the dialog's accessible
 * description. Renders a `p`; pass `as` to render another element or component.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Settings</Dialog.Title>
 *       <Dialog.Description>Update your account.</Dialog.Description>
 *     </Dialog.Header>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogT.DescriptionProps<T>,
): JSX.Element {
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const dialog = useDialogContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => props.id, content.registerDescription)
  const {
    slots: { description: descriptionSlot },
  } = useRecipe(dialogRecipe, props, {
    slot: 'description',
    context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? 'p')
  return (
    <Root
      data-slot="dialog-description"
      {...descriptionSlot}
      {...(rest as Record<string, unknown>)}
      id={id()}
    />
  )
}
