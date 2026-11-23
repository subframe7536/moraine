import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'
/**
 * Main content region of a `Dialog`. Place it inside `Dialog.Content`, between the header and
 * `Dialog.Footer`. Renders a `div`; pass `as` to render another element or component.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings">
 *     <Dialog.Body>Preferences</Dialog.Body>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogBody<T extends ValidComponent = 'div'>(
  props: DialogT.BodyProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style')
  const rest = omit(props, 'as', 'class', 'style')
  const dialog = useDialogContext()
  const content = useDialogContent()
  const {
    slots: { body: bodySlot },
  } = useRecipe(dialogRecipe, local, {
    slot: 'body',
    data: {
      body: dialogDataAttributes.body({
        header: content.hasHeader,
        footer: content.hasFooter,
        scroll: () => !content.overlayScroll(),
      }),
    },
    context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-body"
      {...bodySlot}
      {...(rest as any)}
    />
  )
}
