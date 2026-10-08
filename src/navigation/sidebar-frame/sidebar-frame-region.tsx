import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { SlotClassValue } from '../../theme/style-types'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameStyleSlot } from './sidebar-frame.style-types'

type RegionSlot = Extract<
  keyof SidebarFrameStyleSlot,
  'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'menu'
>

type RegionProps = {
  children?: JSX.Element
  class?: SlotClassValue
  style?: JSX.CSSProperties
}

export function createRegion<P extends RegionProps>(slot: RegionSlot, dataSlot: string) {
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
