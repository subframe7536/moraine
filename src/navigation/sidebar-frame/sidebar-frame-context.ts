import type { JSX } from 'solid-js'

import { createStyles } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotClassValue } from '../../theme/style-types'

import { sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameStyleSlot } from './sidebar-frame.style-types'
import type { SidebarFrameT } from './sidebar-frame.types'

export interface SidebarFrameContext extends SidebarFrameT.Context {
  readonly presentation: {
    classes?: SidebarFrameT.Classes
    styles?: SidebarFrameT.Styles
  }
  readonly scrollThreshold: number
  setScrolled: (scrolled: boolean) => void
}

export const [SidebarFrameProvider, useSidebarFrameContext] =
  createContextProvider<SidebarFrameContext>('SidebarFrame')

export function useSidebarFrame(): SidebarFrameT.Context {
  return useSidebarFrameContext()
}

/** Resolves a sidebar-frame slot with inherited root presentation and variants. */
export function useSidebarFrameStyles<S extends keyof SidebarFrameStyleSlot>(
  rootSlot: S,
  props: { class?: SlotClassValue; style?: JSX.CSSProperties },
) {
  const context = useSidebarFrameContext()
  return createStyles(sidebarFrameRecipe, props, {
    rootSlot,
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })
}
