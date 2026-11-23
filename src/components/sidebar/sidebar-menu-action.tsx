import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'
/**
 * Controls placed over the end of the first row of the enclosing `Sidebar.MenuItem`, such as a
 * `DropdownMenu` trigger, next to its `Sidebar.MenuButton`. The button does not reserve space for
 * it, so add padding such as `pe-8` to a `MenuButton` whose label can run underneath. Renders a
 * `div` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Button, Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Menu>
 *       <Sidebar.MenuItem>
 *         <Sidebar.MenuButton class="pe-8">Projects</Sidebar.MenuButton>
 *         <Sidebar.MenuAction>
 *           <Button size="icon-xs" variant="ghost" aria-label="Project actions" />
 *         </Sidebar.MenuAction>
 *       </Sidebar.MenuItem>
 *     </Sidebar.Menu>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export function SidebarMenuAction<T extends ValidComponent = 'div'>(
  props: SidebarT.MenuActionProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const local = pick(props as SidebarT.MenuActionProps, 'as', 'class', 'style')
  const rest = omit(props as SidebarT.MenuActionProps, 'as', 'class', 'style')
  const { slotWith } = useSidebarStyles('menuAction', local)
  const menuActionSlot = slotWith('menuAction', {
    data: sidebarDataAttributes.menuAction({ mobile: context.mobile }),
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sidebar-menu-action"
      {...menuActionSlot}
      {...rest}
    />
  )
}
