import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useDialogContent } from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogBody<T extends ValidComponent = 'div'>(
  props: DialogT.BodyProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useDialogContent()
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'body',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  const bodyAttrs = dialogDataAttributes.body({
    header: content.hasHeader,
    footer: content.hasFooter,
    scroll: () => !content.overlayScroll(),
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-body"
      attributes={rest}
      additionalAttributes={bodyAttrs}
      binding={resolved.styles.body}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
