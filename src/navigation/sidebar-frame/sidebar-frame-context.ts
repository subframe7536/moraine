import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import type { createComponentStyles } from '../../shared/provider/index.ts'

import type { SidebarFrameT } from './sidebar-frame.types.ts'

export interface SidebarFrameContext extends SidebarFrameT.Context {
  resolved: ReturnType<typeof createComponentStyles<'sidebarFrame'>>
  scrollThreshold: Accessor<number>
  setScrolled: (scrolled: boolean) => void
}

export const [SidebarFrameProvider, useSidebarFrameContext] =
  createContextProvider<SidebarFrameContext>('SidebarFrame')

export function useSidebarFrame(): SidebarFrameT.Context {
  return useSidebarFrameContext()
}
