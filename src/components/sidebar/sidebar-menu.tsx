import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'
/**
 * List of the navigation items of a `Sidebar.Group`. Renders a `ul` by default, so its children
 * should be `Sidebar.MenuItem` entries; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Group>
 *       <Sidebar.Menu>
 *         <Sidebar.MenuItem>
 *           <Sidebar.MenuButton>Home</Sidebar.MenuButton>
 *         </Sidebar.MenuItem>
 *       </Sidebar.Menu>
 *     </Sidebar.Group>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarMenu: <T extends ValidComponent = 'ul'>(
  props: SidebarT.MenuProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('menu', 'sidebar-menu', 'ul')
