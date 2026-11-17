import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/**
 * Footer region at the bottom of `Sidebar.Panel`, suited to an account menu or secondary actions.
 * Renders a `div` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Content>Navigation</Sidebar.Content>
 *     <Sidebar.Footer>Signed in as Ada</Sidebar.Footer>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarFooter: <T extends ValidComponent = 'div'>(
  props: SidebarT.FooterProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('footer', 'sidebar-footer')
