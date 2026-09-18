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

  export type TriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : HTMLElement

  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
    /** Whether this trigger is disabled. */
    disabled?: boolean
    onClick?: JSX.EventHandlerUnion<TriggerElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<TriggerElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<TriggerElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<TriggerElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerMove?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<TriggerElementFor<T>, PointerEvent>
    onContextMenu?: JSX.EventHandlerUnion<TriggerElementFor<T>, MouseEvent>
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
