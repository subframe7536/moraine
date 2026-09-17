import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { CreateStylesResult } from '../../shared/provider/create-styles'

import type { sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

export interface SidebarFrameContext extends SidebarFrameT.Context {
  resolved: CreateStylesResult<typeof sidebarFrameRecipe>
  scrollThreshold: Accessor<number>
  setScrolled: (scrolled: boolean) => void
}

export const [SidebarFrameProvider, useSidebarFrameContext] =
  createContextProvider<SidebarFrameContext>('SidebarFrame')

export function useSidebarFrame(): SidebarFrameT.Context {
  return useSidebarFrameContext()
}
