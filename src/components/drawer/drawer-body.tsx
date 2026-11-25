import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'
/**
 * Main region of `Drawer.Content`, placed between the header and footer. Scrolls once the content
 * height is bounded, and a mouse press inside it does not start a swipe, so text stays selectable.
 * Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content title="Settings">
 *     <Drawer.Body>Preferences</Drawer.Body>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function DrawerBody<T extends ValidComponent = 'div'>(
  props: DrawerT.BodyProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style')
  const rest = omit(props, 'as', 'class', 'style')
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const unregister = content.registerBody()
  onCleanup(unregister)
  const {
    slots: { body: bodySlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'body',
    data: {
      body: drawerDataAttributes.body({
        header: content.hasHeader,
        footer: content.hasFooter,
      }),
    },
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => local.as ?? 'div')
  return <Root data-slot="drawer-body" {...bodySlot} {...(rest as Record<string, unknown>)} />
}
