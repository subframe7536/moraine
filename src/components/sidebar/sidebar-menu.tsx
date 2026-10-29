import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** Container for sidebar menu items. */
export const SidebarMenu: <T extends ValidComponent = 'div'>(
  props: SidebarT.MenuProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('menu', 'sidebar-menu')
