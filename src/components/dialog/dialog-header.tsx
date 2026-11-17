import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

function createDialogHeader(headerKind: 'explicit' | 'shorthand') {
  return function DialogHeader<T extends ValidComponent = 'div'>(
    props: DialogT.HeaderProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const dialog = useDialogContext()
    const content = useDialogContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const {
      slots: { header: headerSlot },
    } = useRecipe(dialogRecipe, local, {
      slot: 'header',
      context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
    })
    return (
      <Dynamic component={local.as ?? 'div'} data-slot="dialog-header" {...headerSlot} {...rest} />
    )
  }
}

/**
 * Header region of a `Dialog` for a custom title and description layout. Place it inside
 * `Dialog.Content` and put `Dialog.Title` and `Dialog.Description` in it; an explicit header
 * replaces the one generated from the `title` and `description` props of `Dialog.Content`. Renders
 * a `div`; pass `as` to render another element or component.
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
 *     <Dialog.Body>Preferences</Dialog.Body>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export const DialogHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('explicit')

export const DialogShorthandHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('shorthand')
