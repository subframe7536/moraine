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
  const { slots } = useRecipe(dialogRecipe, local, {
    slot: 'body',
    contextVariants: () => content.variants,
    contextSlots: () => dialog.slotOverrides,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-body"
      {...dialogDataAttributes.body({
        header: content.hasHeader,
        footer: content.hasFooter,
        scroll: () => !content.overlayScroll(),
      })}
      {...rest}
      {...slots.body}
    />
  )
}
