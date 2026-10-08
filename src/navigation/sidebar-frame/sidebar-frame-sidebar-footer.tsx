import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameSidebarFooter =
  /* @__PURE__ */ createRegion<SidebarFrameT.SidebarFooterProps>(
    'sidebarFooter',
    'sidebar-frame-sidebar-footer',
  )
