import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-region'
import type { SidebarT } from './sidebar.types'

/** Footer region inside the sidebar panel. */
export const SidebarFooter: <T extends ValidComponent = 'div'>(
  props: SidebarT.FooterProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('footer', 'sidebar-footer')
