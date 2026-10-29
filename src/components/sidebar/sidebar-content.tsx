import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** Scrollable content region inside the sidebar panel. */
export const SidebarContent: <T extends ValidComponent = 'div'>(
  props: SidebarT.ContentProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('content', 'sidebar-content')
