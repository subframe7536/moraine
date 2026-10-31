import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogBody<T extends ValidComponent = 'div'>(
  props: DialogT.BodyProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
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
  return <Dynamic component={local.as ?? 'div'} data-slot="dialog-body" {...bodySlot} {...rest} />
}
