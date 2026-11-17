import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

/**
 * Supporting text of the surrounding `Drawer.Content`; its `id` is wired to the surface's
 * `aria-describedby`. Place it inside `Drawer.Content`, usually within `Drawer.Header` below
 * `Drawer.Title`. Renders a `p` by default; pass `as` to change the element.
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
export function DrawerDescription<T extends ValidComponent = 'p'>(
  props: DrawerT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const {
    slots: { description: descriptionSlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'description',
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="drawer-description"
      {...descriptionSlot}
      {...rest}
      id={id()}
    />
  )
}
