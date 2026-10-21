import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const dialog = useDialogContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const { slots } = useRecipe(dialogRecipe, local, {
    slot: 'description',
    contextVariants: () => content.variants,
    contextSlots: () => dialog.slotOverrides,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="dialog-description"
      {...rest}
      id={id()}
      {...slots.description}
    />
  )
}
