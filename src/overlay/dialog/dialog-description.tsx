import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../base/content-anatomy'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useDialogContent } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="p"
      slot="dialog-description"
      attributes={rest}
      binding={resolved.styles.description}
      id={id()}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
