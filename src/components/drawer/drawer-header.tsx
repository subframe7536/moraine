import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'
function createDrawerHeader(headerKind: 'explicit' | 'shorthand') {
  return function DrawerHeader<T extends ValidComponent = 'div'>(
    props: DrawerT.HeaderProps<T>,
  ): JSX.Element {
    const local = pick(props, 'as', 'class', 'style')
    const rest = omit(props, 'as', 'class', 'style')
    const drawer = useDrawerContext()
    const content = useDrawerContent()
    const unregister = content.registerHeader(headerKind)
    onCleanup(unregister)
    const {
      slots: { header: headerSlot },
    } = useRecipe(drawerRecipe, local, {
      slot: 'header',
      data: { header: drawerDataAttributes.header({ body: content.hasBody }) },
      context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
    })
    const Root = dynamic<ValidComponent>(() => local.as ?? 'div')
    return <Root data-slot="drawer-header" {...headerSlot} {...(rest as any)} />
  }
}

/**
 * Layout group for `Drawer.Title` and `Drawer.Description` inside `Drawer.Content`. Placing it
 * explicitly replaces the header that `Content` generates from its `title` and `description` props.
 * Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content>
 *     <Drawer.Header>
 *       <Drawer.Title>Settings</Drawer.Title>
 *       <Drawer.Description>Update your account.</Drawer.Description>
 *     </Drawer.Header>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export const DrawerHeader: <T extends ValidComponent = 'div'>(
  props: DrawerT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDrawerHeader('explicit')

export const DrawerShorthandHeader: <T extends ValidComponent = 'div'>(
  props: DrawerT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createDrawerHeader('shorthand')
