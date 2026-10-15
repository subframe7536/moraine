import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useModalContext } from '../modal/modal-context'

import { useDialogContent } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

function createDialogHeader(headerKind: 'explicit' | 'shorthand') {
  return function DialogHeader<T extends ValidComponent = 'div'>(
    props: DialogT.HeaderProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const family = useModalContext()
    const content = useDialogContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const { slots } = useRecipe(dialogRecipe, local, {
      slot: 'header',
      contextVariants: () => content.variants,
      contextSlots: () => family.slotOverrides,
    })
    return (
      <Dynamic
        component={local.as ?? 'div'}
        data-slot="dialog-header"
        {...rest}
        {...slots.header}
      />
    )
  }
}

export const DialogHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('explicit')

export const DialogShorthandHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('shorthand')
