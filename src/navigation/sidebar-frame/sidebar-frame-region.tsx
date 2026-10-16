import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameStyleSlot } from './sidebar-frame.style-types'

export type RegionSlot = Extract<
  keyof SidebarFrameStyleSlot,
  'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'menu'
>

export type RegionProps<T extends ValidComponent = 'div'> = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createRegion<S extends RegionSlot>(slot: S, dataSlot: string) {
  return function SidebarFrameRegion<T extends ValidComponent = 'div'>(
    props: RegionProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const resolved = useSidebarFrameStyles(slot, local)
    const tag = (): ValidComponent => local.as ?? 'div'
    return <Dynamic component={tag()} data-slot={dataSlot} {...rest} {...resolved.slots[slot]} />
  }
}
