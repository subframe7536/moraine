import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

function createDrawerHeader(headerKind: 'explicit' | 'shorthand') {
  return function DrawerHeader<T extends ValidComponent = 'div'>(
    props: DrawerT.HeaderProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const drawer = useDrawerContext()
    const content = useDrawerContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const {
      slots: { header: headerSlot },
    } = useRecipe(drawerRecipe, local, {
      slot: 'header',
      context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
    })
    return (
      <Dynamic component={local.as ?? 'div'} data-slot="drawer-header" {...headerSlot} {...rest} />
    )
  }
}

export const DrawerHeader: <T extends ValidComponent = 'div'>(
  props: DrawerT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDrawerHeader('explicit')

export const DrawerShorthandHeader: <T extends ValidComponent = 'div'>(
  props: DrawerT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDrawerHeader('shorthand')
