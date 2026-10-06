import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { SlotClassValue } from '../../theme/style-types'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameStyleSlot } from './sidebar-frame.style-types'
import type { SidebarFrameT } from './sidebar-frame.types'

type RegionSlot = Extract<
  keyof SidebarFrameStyleSlot,
  'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'menu'
>

type RegionProps = {
  children?: JSX.Element
  class?: SlotClassValue
  style?: JSX.CSSProperties
}

function createRegion<P extends RegionProps>(slot: RegionSlot, dataSlot: string) {
  return function SidebarFrameRegion(props: P): JSX.Element {
    const [local, rest] = splitProps(props as RegionProps, ['children', 'class', 'style'])
    const resolved = useSidebarFrameStyles(slot, local)
    return (
      <div data-slot={dataSlot} {...rest} {...resolved.styles[slot]}>
        {local.children}
      </div>
    )
  }
}

export const SidebarFrameSidebarHeader = createRegion<SidebarFrameT.SidebarHeaderProps>(
  'sidebarHeader',
  'sidebar-frame-sidebar-header',
)

export const SidebarFrameSidebarBody = createRegion<SidebarFrameT.SidebarBodyProps>(
  'sidebarBody',
  'sidebar-frame-sidebar-body',
)

export const SidebarFrameSidebarFooter = createRegion<SidebarFrameT.SidebarFooterProps>(
  'sidebarFooter',
  'sidebar-frame-sidebar-footer',
)

export const SidebarFrameMenu = createRegion<SidebarFrameT.MenuProps>('menu', 'sidebar-frame-menu')
