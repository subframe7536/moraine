import type { Accessor, JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon'
import type {
  BaseProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { SidebarFrameStyleSlot, SidebarFrameStyleVariant } from './sidebar-frame.style-types'

export namespace SidebarFrameT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = SidebarFrameStyleSlot<T>

  export type Variant = SidebarFrameStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type State = 'expanded' | 'collapsed'

  export interface Context {
    side: 'left' | 'right'
    variant?: Variant['variant'] | null
    state: Accessor<State>
    isMobile: Accessor<boolean>
    scrolled: Accessor<boolean>
    isOpen: Accessor<boolean>
    setOpen: (open: boolean) => void
    toggle: () => void
    sidebarId: Accessor<string>
  }

  export interface Base {
    /**
     * Side occupied by the sidebar.
     * @default 'left'
     */
    side?: 'left' | 'right'
    /** Controlled open state on desktop. */
    open?: boolean
    /**
     * Default open state on desktop.
     * @default true
     */
    defaultOpen?: boolean
    /** Callback invoked when desktop open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Controlled mobile mode. When omitted, `matchMedia` uses `breakpoint`. */
    isMobile?: boolean
    /**
     * Main scroll offset that changes `scrolled` to true.
     * @default 60
     */
    scrollThreshold?: number
    /**
     * Max viewport width in pixels that counts as mobile.
     * Used as `(max-width: ${breakpoint}px)` when `isMobile` is omitted.
     * @default 768
     */
    breakpoint?: number
    /** Stable identifier used for associating Trigger `aria-controls` with Sidebar. */
    sidebarId?: string
    children?: JSX.Element
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>

  export interface SidebarBase<T extends ValidComponent = 'aside'> {
    children?: JSX.Element
    as?: T
    /**
     * Accessible name for the mobile navigation Sheet. Native aria-label takes precedence;
     * title is used when neither native aria-label nor this prop is provided.
     * Localized via MoraineProvider messages when omitted. English default is `Sidebar navigation`.
     */
    ariaLabel?: string
    'aria-label'?: string
  }

  export type SidebarProps<T extends ValidComponent = 'aside'> = BaseProps<
    T,
    SidebarBase<T>,
    never,
    never,
    never,
    'aside'
  >

  export interface SidebarHeaderBase {
    children?: JSX.Element
  }
  export type SidebarHeaderProps = BaseProps<'div', SidebarHeaderBase, never, never, never>

  export interface SidebarBodyBase {
    children?: JSX.Element
  }
  export type SidebarBodyProps = BaseProps<'div', SidebarBodyBase, never, never, never>

  export interface SidebarFooterBase {
    children?: JSX.Element
  }
  export type SidebarFooterProps = BaseProps<'div', SidebarFooterBase, never, never, never>

  export interface MainBase<T extends ValidComponent = 'div'> {
    children?: JSX.Element
    as?: T
    onScroll?: JSX.EventHandlerUnion<HTMLElement, UIEvent>
  }
  export type MainProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    MainBase<T>,
    never,
    never,
    never,
    'div'
  >

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

  export interface MenuBase {
    children?: JSX.Element
  }
  export type MenuProps = BaseProps<'div', MenuBase, never, never, never>

  export interface LabelBase<T extends ValidComponent = 'div'> {
    children?: JSX.Element
    as?: T
  }
  export type LabelProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    LabelBase<T>,
    never,
    never,
    never,
    'div'
  >

  export type ItemBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    href?: string
    isActive?: boolean
    leading?: IconT.Name
    trailing?: IconT.Name
    /**
     * Trailing actions (e.g. action buttons or dropdown menu) rendered alongside the item.
     */
    actions?: JSX.Element
    /**
     * Whether activating this item on mobile closes the sheet.
     * When omitted, items with `href` close the sheet.
     */
    closeOnSelect?: boolean
  }

  export type ItemProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    ItemBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface SubmenuBase {
    children?: JSX.Element
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    disabled?: boolean
    transition?: boolean
    unmountOnHide?: boolean
  }

  export type SubmenuProps = BaseProps<'div', SubmenuBase, never, never, never>

  export type SubmenuTriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    leading?: IconT.Name
    trailing?: IconT.Name
  }

  export type SubmenuTriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    SubmenuTriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface SubmenuContentBase {
    children?: JSX.Element
  }
  export type SubmenuContentProps = BaseProps<'div', SubmenuContentBase, never, never, never>
}

export type SidebarFrameProps = SidebarFrameT.Props
