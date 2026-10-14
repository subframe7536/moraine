import type { JSX } from 'solid-js'
import { onCleanup, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
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
  const { slots } = useRecipe(dialogRecipe, local, {
    slot: 'header',
    contextVariants: () => content.variants,
    contextSlots: () => family.slotOverrides,
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="dialog-header" {...rest} {...slots.header}>
      {local.children}
    </Dynamic>
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
