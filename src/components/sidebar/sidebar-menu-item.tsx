import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'
/**
 * One entry of a `Sidebar.Menu`. Holds a `Sidebar.MenuButton` with an optional
 * `Sidebar.MenuAction`, or a `Sidebar.MenuSub` for nested navigation. Renders an `li` by default;
 * pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Menu>
 *       <Sidebar.MenuItem>
 *         <Sidebar.MenuButton leading="i-lucide:home">Home</Sidebar.MenuButton>
 *       </Sidebar.MenuItem>
 *     </Sidebar.Menu>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarMenuItem: <T extends ValidComponent = 'li'>(
  props: SidebarT.MenuItemProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('menuItem', 'sidebar-menu-item', 'li')
