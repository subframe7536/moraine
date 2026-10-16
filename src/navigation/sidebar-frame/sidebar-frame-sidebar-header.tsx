import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameSidebarHeader: <T extends ValidComponent = 'div'>(
  props: SidebarFrameT.SidebarHeaderProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('sidebarHeader', 'sidebar-frame-sidebar-header')
