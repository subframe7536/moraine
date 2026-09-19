import type { Accessor, JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

export namespace SidebarFrameT {
  export type Kind = 'composite'

  export interface Context {
    side: 'left' | 'right'
    variant?: Variant['variant'] | null
    isMobile: Accessor<boolean>
    scrolled: Accessor<boolean>
    isOpen: Accessor<boolean>
    setOpen: (open: boolean) => void
    toggle: () => void
  }

  export type Slot<T = unknown> = SidebarFrameStyleSlot<T>

  export type Variant = SidebarFrameStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /**
     * Side occupied by the sidebar.
     * @default 'left'
     */
    side?: 'left' | 'right'
    /** Controlled mobile mode. When omitted, `matchMedia` determines the value. */
    isMobile?: boolean
    /**
     * Main scroll offset that changes `scrolled` to true.
     * @default 60
     */
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

  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T
    /** Whether this trigger is disabled. */
    disabled?: boolean
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never
  >
}

export interface SidebarFrameProps extends SidebarFrameT.Props {}
