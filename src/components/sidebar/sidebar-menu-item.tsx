import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** List item that holds a `MenuButton` with an optional `MenuAction`, or a `MenuSub`. */
export const SidebarMenuItem: <T extends ValidComponent = 'li'>(
  props: SidebarT.MenuItemProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('menuItem', 'sidebar-menu-item', 'li')
