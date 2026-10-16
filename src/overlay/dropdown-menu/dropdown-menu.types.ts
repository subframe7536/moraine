import type { Component, JSX } from 'solid-js'

import type { IconT } from '../../element/icon'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type {
  SlotClassValue,
  SlotStyleValue,
  OverlayAlign,
  OverlayPlacement,
} from '../../theme/style-types'
import type {
  OverlayMenuContentSlotProps,
  OverlayMenuItem,
  OverlayMenuItemRenderProps,
} from '../base/menu'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../base/trigger'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export namespace DropdownMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DropdownMenuStyleSlot<T>
  export type Variant = DropdownMenuStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = OverlayMenuItem
  export type ItemRenderProps = OverlayMenuItemRenderProps
  export type TopRenderProps = OverlayMenuContentSlotProps
  export type BottomRenderProps = OverlayMenuContentSlotProps

  /**
   * Base props for the DropdownMenu root component.
   */
  export interface Base {
    /** Unique identifier for the menu. */
    id?: string
    /** Controlled open state. */
    open?: boolean
    /** Initial open state when uncontrolled. @default false */
    defaultOpen?: boolean
    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Whether trigger interactions should be ignored. @default false */
    disabled?: boolean
    /** Preferred side relative to the anchor. @default 'bottom' */
    placement?: OverlayPlacement
    /** Alignment along the cross axis. @default 'start' */
    align?: OverlayAlign
    /** Gap between the anchor and the content. @default 0 */
    gutter?: number
    /** Cross-axis or alignment offset relative to the anchor. @default 0 */
    shift?: number
    /** Whether body scroll should be locked while the menu is open. @default true */
    preventScroll?: boolean
    /** Padding applied to the overflow area when calculating position. @default 4 */
    overflowPadding?: number
    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variant, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface ContentBase {
    /** Items rendered in the menu body. Supports flat array, explicit group objects, or array-of-arrays. */
    items?: (Item | Item[])[]
    /** Renderer for each menu item. */
    itemRender?: Component<ItemRenderProps>
    /** Content rendered before the resolved item groups. */
    topRender?: JSX.Element | Component<TopRenderProps>
    /** Content rendered after the resolved item groups. */
    bottomRender?: JSX.Element | Component<BottomRenderProps>
    /** Icon used for checked checkbox items. @default 'icon-check' */
    checkedIcon?: IconT.Name
    /** Icon used for submenu trigger items. @default 'icon-chevron-right' */
    submenuIcon?: IconT.Name
  }

  /**
   * Props for the DropdownMenu content component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the DropdownMenu component.
 */
export type DropdownMenuProps = DropdownMenuT.Props
