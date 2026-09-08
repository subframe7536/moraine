import type { Accessor, JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace SidebarFrameT {
  export type Kind = 'composite'

  export interface Context extends Variant {
    side: 'left' | 'right'
    isMobile: Accessor<boolean>
    scrolled: Accessor<boolean>
    isOpen: Accessor<boolean>
    setOpen: (open: boolean) => void
    toggle: () => void
  }

  export interface Slot<T = unknown> {
    root?: T
    sidebar?: T
    sidebarHeader?: T
    sidebarBody?: T
    sidebarFooter?: T
    main?: T
  }

  export interface Variant {
    side?: 'left' | 'right' | null
    variant?: 'default' | 'floating' | 'inset' | null
  }

  export type SlotName = keyof Slot
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /** Side occupied by the sidebar. @default 'left' */
    side?: 'left' | 'right'
    /** Controlled mobile mode. When omitted, `matchMedia` determines the value. */
    isMobile?: boolean
    /** Main scroll offset that changes `scrolled` to true. @default 60 */
    scrollThreshold?: number
    children?: JSX.Element
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>

  export interface RegionBase {
    children?: JSX.Element
  }

  export type SidebarProps = BaseProps<'div', RegionBase, never, never, never>
  export type SidebarHeaderProps = BaseProps<'div', RegionBase, never, never, never>
  export type SidebarBodyProps = BaseProps<'div', RegionBase, never, never, never>
  export type SidebarFooterProps = BaseProps<'div', RegionBase, never, never, never>
  export type MainProps = BaseProps<'div', RegionBase, never, never, never>
}

export interface SidebarFrameProps extends SidebarFrameT.Props {}
