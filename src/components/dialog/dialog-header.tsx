import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDialogContent, useDialogContext } from './dialog-context'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

function createDialogHeader(headerKind: 'explicit' | 'shorthand') {
  return function DialogHeader<T extends ValidComponent = 'div'>(
    props: DialogT.HeaderProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const dialog = useDialogContext()
    const content = useDialogContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const {
      slots: { header: headerSlot },
    } = useRecipe(dialogRecipe, local, {
      slot: 'header',
      context: () => ({ variants: content.variants, ...dialog.slotOverrides }),
    })
    return (
      <Dynamic component={local.as ?? 'div'} data-slot="dialog-header" {...headerSlot} {...rest} />
    )
  }
}

export const DialogHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('explicit')

export const DialogShorthandHeader: <T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDialogHeader('shorthand')
