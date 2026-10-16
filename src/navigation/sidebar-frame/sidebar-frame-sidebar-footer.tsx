import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameSidebarFooter: <T extends ValidComponent = 'div'>(
  props: SidebarFrameT.SidebarFooterProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('sidebarFooter', 'sidebar-frame-sidebar-footer')
