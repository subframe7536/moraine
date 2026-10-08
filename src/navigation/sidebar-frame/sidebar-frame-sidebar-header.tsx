import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameSidebarHeader =
  /* @__PURE__ */ createRegion<SidebarFrameT.SidebarHeaderProps>(
    'sidebarHeader',
    'sidebar-frame-sidebar-header',
  )
