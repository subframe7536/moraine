import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type {
  SlotClassValue,
  SlotStyleValue,
  OverlayAlign,
  OverlayPlacement,
} from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  OverlayMenuContentSlotProps,
  OverlayMenuItem,
  OverlayMenuItemRenderProps,
} from '../shared/overlay/menu'
import type { OverlayTriggerBase } from '../shared/overlay/trigger'

import type { ContextMenuStyleSlot, ContextMenuStyleVariants } from './context-menu.style-types'

export namespace ContextMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = ContextMenuStyleSlot<T>
  export type Variants = ContextMenuStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = OverlayMenuItem
  export type ItemRenderProps = OverlayMenuItemRenderProps
  export type TopRenderProps = OverlayMenuContentSlotProps
  export type BottomRenderProps = OverlayMenuContentSlotProps

  /**
   * Base props for the ContextMenu root component.
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
    /** Preferred side relative to the anchor. @default 'right' */
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
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'div'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'div'
  >

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
   * Props for the ContextMenu content component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the ContextMenu component.
 */
export type ContextMenuProps = ContextMenuT.Props
