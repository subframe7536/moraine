import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../base/content-anatomy'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogTitle<T extends ValidComponent = 'h2'>(
  props: DialogT.TitleProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const dialog = useDialogContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const { slots } = useRecipe(dialogRecipe, local, {
    slot: 'title',
    contextVariants: () => content.variants,
    contextSlots: () => dialog.slotOverrides,
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="dialog-title"
      {...rest}
      id={id()}
      {...slots.title}
    />
  )
}
