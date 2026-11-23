import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'
/**
 * Accessible title of the surrounding `Drawer.Content`; its `id` is wired to the surface's
 * `aria-labelledby` unless `Content` has its own `aria-label`. Place it inside `Drawer.Content`,
 * usually within `Drawer.Header`. Renders an `h2` by default; pass `as` to change the element.
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
 *     </Drawer.Header>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function DrawerTitle<T extends ValidComponent = 'h2'>(
  props: DrawerT.TitleProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style', 'id')
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const {
    slots: { title: titleSlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'title',
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="drawer-title"
      {...titleSlot}
      {...(rest as any)}
      id={id()}
    />
  )
}
