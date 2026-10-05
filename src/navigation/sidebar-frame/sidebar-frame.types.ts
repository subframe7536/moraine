import type { Accessor, JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon'
import type {
  BaseProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

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

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface GroupBase extends SidebarFrameRegionBase {}
  export type GroupProps = BaseProps<'div', GroupBase, never, never, never>

  export interface GroupLabelBase<T extends ValidComponent = 'div'> extends SidebarFrameRegionBase {
    as?: T
  }
  export type GroupLabelProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    GroupLabelBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface MenuBase extends SidebarFrameRegionBase {}
  export type MenuProps = BaseProps<'div', MenuBase, never, never, never>

  export type ItemBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    href?: string
    isActive?: boolean
    leading?: IconT.Name
    trailing?: IconT.Name
  }

  export type ItemProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    ItemBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface SubTriggerRenderProps {
    open: Accessor<boolean>
    disabled: boolean
    label: JSX.Element
    leading?: IconT.Name
    trailing?: IconT.Name
  }

  export interface SubBase extends SidebarFrameRegionBase {
    label: JSX.Element
    href?: string
    isActive?: boolean
    triggerClass?: string
    leading?: IconT.Name
    trailing?: IconT.Name
    triggerRender?: (props: SubTriggerRenderProps) => JSX.Element
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    disabled?: boolean
    transition?: boolean
    unmountOnHide?: boolean
  }

  export type SubProps = BaseProps<'div', SubBase, never, never, never>
}

export type SidebarFrameProps = SidebarFrameT.Props
