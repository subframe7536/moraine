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
 * Visible heading that names a `Dialog`. Place it inside `Dialog.Content`, usually within
 * `Dialog.Header`; its id is connected to the dialog's accessible name. Without a visible title,
 * supply `aria-label` on `Dialog.Content` instead. Renders an `h2`; pass `as` to render another
 * element or component.
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
 *     </Dialog.Header>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogTitle<T extends ValidComponent = 'h2'>(
  props: DialogT.TitleProps<T>,
): JSX.Element {
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const dialog = useDialogContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => props.id, content.registerTitle)
  const {
    slots: { title: titleSlot },
  } = useRecipe(dialogRecipe, props, {
    slot: 'title',
    context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? 'h2')
  return (
    <Root
      data-slot="dialog-title"
      {...titleSlot}
      {...(rest as Record<string, unknown>)}
      id={id()}
    />
  )
}
