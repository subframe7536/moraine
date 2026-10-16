import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createRegion } from './sidebar-frame-region'
import type { SidebarFrameT } from './sidebar-frame.types'

export const SidebarFrameMenu: <T extends ValidComponent = 'div'>(
  props: SidebarFrameT.MenuProps<T>,
) => JSX.Element = /* @__PURE__ */ createRegion('menu', 'sidebar-frame-menu')
