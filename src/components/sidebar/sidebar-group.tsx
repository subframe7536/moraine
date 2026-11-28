import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'
/**
 * Navigation section of `Sidebar.Content` that holds a `Sidebar.GroupLabel` and a `Sidebar.Menu`.
 * Renders a `div` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Content>
 *       <Sidebar.Group>
 *         <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
 *         <Sidebar.Menu />
 *       </Sidebar.Group>
 *     </Sidebar.Content>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarGroup: <T extends ValidComponent = 'div'>(
  props: SidebarT.GroupProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('group', 'sidebar-group')
