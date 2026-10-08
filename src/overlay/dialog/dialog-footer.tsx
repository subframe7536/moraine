import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useDialogContent } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogFooter<T extends ValidComponent = 'div'>(
  props: DialogT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useDialogContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'footer',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-footer"
      attributes={rest}
      binding={resolved.styles.footer}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}
