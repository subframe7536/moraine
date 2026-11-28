import type { JSX } from '@solidjs/web'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'
/**
 * Header region at the top of `Sidebar.Panel`, suited to a brand or a workspace switcher. Renders a
 * `div` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Header>Acme Inc.</Sidebar.Header>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export const SidebarHeader: <T extends ValidComponent = 'div'>(
  props: SidebarT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('header', 'sidebar-header')
