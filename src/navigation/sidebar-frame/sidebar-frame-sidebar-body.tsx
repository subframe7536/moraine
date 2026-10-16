import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameSidebarBody: <T extends ValidComponent = 'div'>(
  props: SidebarFrameT.SidebarBodyProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('sidebarBody', 'sidebar-frame-sidebar-body')
