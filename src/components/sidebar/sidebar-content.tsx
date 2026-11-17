import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/**
 * Scrollable region of `Sidebar.Panel` that holds the navigation groups between the header and the
 * footer. Renders a `div` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Content>
 *       <Sidebar.Group>Groups go here</Sidebar.Group>
 *     </Sidebar.Content>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarContent: <T extends ValidComponent = 'div'>(
  props: SidebarT.ContentProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('content', 'sidebar-content')
