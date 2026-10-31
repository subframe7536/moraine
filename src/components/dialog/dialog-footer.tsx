import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogFooter<T extends ValidComponent = 'div'>(
  props: DialogT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const dialog = useDialogContext()
  const content = useDialogContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const {
    slots: { footer: footerSlot },
  } = useRecipe(dialogRecipe, local, {
    slot: 'footer',
    context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="dialog-footer" {...footerSlot} {...rest} />
  )
}
