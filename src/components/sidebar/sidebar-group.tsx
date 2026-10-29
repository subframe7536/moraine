import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** Navigation section that holds a group label and a menu. */
export const SidebarGroup: <T extends ValidComponent = 'div'>(
  props: SidebarT.GroupProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('group', 'sidebar-group')
