import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** Header region inside the sidebar panel. */
export const SidebarHeader: <T extends ValidComponent = 'div'>(
  props: SidebarT.HeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('header', 'sidebar-header')
