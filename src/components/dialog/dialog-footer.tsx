import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'
/**
 * Action area at the bottom of a `Dialog`. Place it inside `Dialog.Content` after `Dialog.Body`,
 * typically with `Dialog.Close` or other buttons. Renders a `div`; pass `as` to render another
 * element or component.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings">
 *     <Dialog.Body>Preferences</Dialog.Body>
 *     <Dialog.Footer>
 *       <Dialog.Close as={Button}>Done</Dialog.Close>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogFooter<T extends ValidComponent = 'div'>(
  props: DialogT.FooterProps<T>,
): JSX.Element {
  const rest = omit(props, 'as', 'class', 'style')
  const dialog = useDialogContext()
  const content = useDialogContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const {
    slots: { footer: footerSlot },
  } = useRecipe(dialogRecipe, props, {
    slot: 'footer',
    context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? 'div')
  return <Root data-slot="dialog-footer" {...footerSlot} {...(rest as Record<string, unknown>)} />
}
