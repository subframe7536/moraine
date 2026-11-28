import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
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
  const rest = omit(props, 'as', 'class', 'style', 'id')
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const id = useRegisteredContentId(() => props.id, content.registerTitle)
  const {
    slots: { title: titleSlot },
  } = useRecipe(drawerRecipe, props, {
    slot: 'title',
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? 'h2')
  return (
    <Root
      data-slot="drawer-title"
      {...titleSlot}
      {...(rest as Record<string, unknown>)}
      id={id()}
    />
  )
}
