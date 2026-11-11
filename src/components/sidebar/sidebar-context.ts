import type { Accessor, JSX } from 'solid-js'

import { useRecipe } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotClassValue } from '../../theme/style-types'

import { sidebarRecipe } from './sidebar.recipe'
import type { SidebarStyleSlot } from './sidebar.style-types'
import type { SidebarT } from './sidebar.types'

export interface SidebarContext extends SidebarT.Context {
  readonly slotOverrides: {
    classes?: SidebarT.Classes
    styles?: SidebarT.Styles
  }
  /** Desktop panel width in pixels; `undefined` falls back to the recipe default. */
  width: Accessor<number | undefined>
  setWidth: (width: number) => void
  commitWidth: (width: number) => void
  minWidth: Accessor<number>
  maxWidth: Accessor<number>
  /** True while a `Sidebar.Rail` drag is active. */
  resizing: Accessor<boolean>
  setResizing: (resizing: boolean) => void
  /** Desktop panel element published by `Sidebar.Panel`; used by `Rail` for measuring. */
  panelElement: Accessor<HTMLElement | undefined>
  setPanelElement: (element: HTMLElement | undefined) => void
}

export const [SidebarProvider, useSidebarContext] =
  /* @__PURE__ */ createContextProvider<SidebarContext>('Sidebar')

export function useSidebarStyles(
  slot: keyof SidebarStyleSlot,
  local: {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  },
) {
  const context = useSidebarContext()
  return useRecipe(sidebarRecipe, local, {
    slot,
    context: () => ({
      variants: {
        side: context.side,
        variant: context.variant,
      },
      ...context.slotOverrides,
    }),
  })
}
