import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarStyleSlot } from './sidebar.style-types'

export type RegionSlot = Extract<
  keyof SidebarStyleSlot,
  'header' | 'content' | 'footer' | 'group' | 'menu'
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
  return function SidebarRegion<T extends ValidComponent = 'div'>(
    props: RegionProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'class', 'style'])
    const resolved = useSidebarStyles(slot, local)
    const tag = (): ValidComponent => local.as ?? 'div'
    return <Dynamic component={tag()} data-slot={dataSlot} {...rest} {...resolved.slots[slot]} />
  }
}
