import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit, onSettled } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'
/**
 * Action area at the end of `Drawer.Content`, below `Drawer.Body`, typically holding buttons such
 * as `Drawer.Close`. Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content title="Settings">
 *     <Drawer.Body>Preferences</Drawer.Body>
 *     <Drawer.Footer>
 *       <Drawer.Close as={Button}>Done</Drawer.Close>
 *     </Drawer.Footer>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function DrawerFooter<T extends ValidComponent = 'div'>(
  props: DrawerT.FooterProps<T>,
): JSX.Element {
  const rest = omit(props, 'as', 'class', 'style')
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  onSettled(() => content.registerFooter())
  const {
    slots: { footer: footerSlot },
  } = useRecipe(drawerRecipe, props, {
    slot: 'footer',
    data: { footer: drawerDataAttributes.footer({ body: content.hasBody }) },
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? 'div')
  return <Root data-slot="drawer-footer" {...footerSlot} {...(rest as Record<string, unknown>)} />
}
