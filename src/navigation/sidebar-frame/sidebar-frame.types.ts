import type { Accessor, JSX } from 'solid-js'

import type {
  BaseProps,
  SlotClassValue,
  SlotStyleValue,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

interface SidebarFrameRegionBase {
  children?: JSX.Element
}

export namespace SidebarFrameT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = SidebarFrameStyleSlot<T>

  export type Variant = SidebarFrameStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Context {
    side: 'left' | 'right'
    variant?: Variant['variant'] | null
    isMobile: Accessor<boolean>
    scrolled: Accessor<boolean>
    isOpen: Accessor<boolean>
    setOpen: (open: boolean) => void
    toggle: () => void
  }

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

  export interface SidebarBase extends SidebarFrameRegionBase {
    /**
     * Accessible name for the mobile navigation Sheet. Native aria-label takes precedence;
     * title is used when neither native aria-label nor this prop is provided.
     * @default 'Sidebar navigation'
     */
    ariaLabel?: string
  }

  export type SidebarProps = BaseProps<'div', SidebarBase, never, never, never>

  export interface SidebarHeaderBase extends SidebarFrameRegionBase {}
  export type SidebarHeaderProps = BaseProps<'div', SidebarHeaderBase, never, never, never>

  export interface SidebarBodyBase extends SidebarFrameRegionBase {}
  export type SidebarBodyProps = BaseProps<'div', SidebarBodyBase, never, never, never>

  export interface SidebarFooterBase extends SidebarFrameRegionBase {}
  export type SidebarFooterProps = BaseProps<'div', SidebarFooterBase, never, never, never>

  export interface MainBase extends SidebarFrameRegionBase {}
  export type MainProps = BaseProps<'div', MainBase, never, never, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T>

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >
}

export type SidebarFrameProps = SidebarFrameT.Props
