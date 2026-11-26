import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarStyleSlot } from './sidebar.style-types'
export type RegionSlot = Extract<
  keyof SidebarStyleSlot,
  'header' | 'content' | 'footer' | 'group' | 'menu' | 'menuItem'
>

export type RegionProps<T extends ValidComponent = 'div'> = {
  [key: string]: unknown
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createRegion<S extends RegionSlot>(
  slot: S,
  dataSlot: string,
  defaultTag: ValidComponent = 'div',
) {
  return function SidebarRegion<T extends ValidComponent = 'div'>(
    props: RegionProps<T>,
  ): JSX.Element {
    const rest = omit(props, 'as', 'class', 'style')
    const {
      slots: { [slot]: regionSlot },
    } = useSidebarStyles(slot, props)
    const Root = dynamic<ValidComponent>(() => props.as ?? defaultTag)
    return <Root data-slot={dataSlot} {...regionSlot} {...(rest as Record<string, unknown>)} />
  }
}
