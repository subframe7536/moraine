import type { JSX } from 'solid-js'
import { onCleanup, splitProps, untrack } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { useModalContext } from '../modal/modal-context'

import { useDialogContent } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

function DialogHeaderRoot<T extends ValidComponent>(
  props: DialogT.HeaderProps<T> & { headerKind: 'explicit' | 'shorthand' },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'headerKind'])
  const family = useModalContext()
  const content = useDialogContent()
  const unregister = content.registerHeader(untrack(() => local.headerKind))
  onCleanup(unregister)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-header"
      attributes={rest}
      binding={resolved.styles.header}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}

export function DialogHeader<T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
): JSX.Element {
  return <DialogHeaderRoot {...props} headerKind="explicit" />
}

export function DialogShorthandHeader<T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
): JSX.Element {
  return <DialogHeaderRoot {...props} headerKind="shorthand" />
}
