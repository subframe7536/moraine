import type { Component, JSX } from 'solid-js'

import type { PopperContentOptions } from '../../overlay/base/popper.types'
import type {
  BaseProps,
  ElementProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { OverlayAlign, SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type {
  NavigationMenuStyleSlot,
  NavigationMenuStyleVariant,
} from './navigation-menu.style-types'

export namespace NavigationMenuT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = NavigationMenuStyleSlot<T>
  export type Variant = NavigationMenuStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base extends Pick<
    PopperContentOptions,
    'placement' | 'shift' | 'overflowPadding' | 'flip' | 'slide'
  > {
    /** Alignment relative to the trigger. @default center */
    align?: OverlayAlign
    /** Gap between the trigger and panel, in pixels. @default 8 */
    gutter?: number
    /** Open item value. null closes the menu. */
    value?: string | null
    /** Initial open item value. @default null */
    defaultValue?: string | null
    /** Called when an interaction requests a different open item. */
    onValueChange?: (value: string | null) => void
    /** Disable navigation interactions. @default false */
    disabled?: boolean
    /** Hover delay before the first panel opens, in milliseconds. @default 50 */
    openDelay?: number
    /** Delay after the pointer leaves the menu, in milliseconds. @default 50 */
    closeDelay?: number
    /** Composed navigation parts. */
    children?: JSX.Element
  }
  export type Props = BaseProps<'nav', Base, Variant, Classes, Styles>

  export interface ListBase {}
  export type ListProps = BaseProps<'ul', ListBase, never, never, never, 'ul', true>

  export interface ItemBase {
    /** Unique item value. Generated when omitted; set explicitly for controlled usage. */
    value?: string
    /** Disable this item's trigger or direct links. @default false */
    disabled?: boolean
    children?: JSX.Element
  }
  export type ItemProps = BaseProps<'li', ItemBase, never, never, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface ContentBase {}
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never, 'div', true>

  /** Native anchor props passed to a custom link component, including its ref and handlers. */
  export type LinkRenderProps = ElementProps<
    HTMLAnchorElement,
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>
  >
  export interface LinkBase {
    /** Mark this link as the current page. @default false */
    active?: boolean
    /** Disable navigation from this link. @default false */
    disabled?: boolean
    /** Close the panel after an uncancelled link click. @default false */
    closeOnClick?: boolean
    /** Custom link component. Forward all supplied props to its anchor. */
    linkRender?: Component<LinkRenderProps>
    children?: JSX.Element
  }
  export type LinkProps = BaseProps<'a', LinkBase, never, never, never>
}

export type NavigationMenuProps = NavigationMenuT.Props
