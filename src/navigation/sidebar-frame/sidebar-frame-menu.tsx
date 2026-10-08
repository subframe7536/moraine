import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameMenu = /* @__PURE__ */ createRegion<SidebarFrameT.MenuProps>(
  'menu',
  'sidebar-frame-menu',
)
