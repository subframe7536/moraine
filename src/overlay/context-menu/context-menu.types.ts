import type { JSX } from 'solid-js'

import type { BaseProps, ElementProps, ValidComponent } from '../../shared/types'
import type {
  SlotClassValue,
  SlotStyleValue,
  OverlayAlign,
  OverlayPlacement,
} from '../../theme/style-types'
import type {
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
} from '../base/menu'
import type { OverlayTriggerBase } from '../base/trigger'

import type { ContextMenuStyleSlot, ContextMenuStyleVariant } from './context-menu.style-types'

export namespace ContextMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = ContextMenuStyleSlot<T>
  export type Variant = ContextMenuStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item extends OverlayMenuSharedItem<Item> {}
  export type ItemRenderProps = OverlayMenuSharedItemRenderProps<Item>

  /**
   * Base props for the ContextMenu component.
   */
  export interface Base extends Pick<
    OverlayMenuRootProps<Item>,
    | 'id'
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'gutter'
    | 'shift'
    | 'preventScroll'
    | 'overflowPadding'
  > {
    /** Preferred side relative to the anchor.
     * @default 'right'
     */
    placement?: OverlayPlacement
    /** Alignment along the cross axis.
     * @default 'start'
     */
    align?: OverlayAlign
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variant, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'div'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface ContentBase extends Omit<
    OverlayMenuRootProps<Item>,
    keyof Base | 'classes' | 'styles' | 'itemProps' | 'itemRender' | 'contentProps' | 'size'
  > {
    /** Renderer for each menu item. */
    itemRender?: (props: ItemRenderProps) => JSX.Element
    /** Additional attributes for an interactive menu item. */
    itemProps?: (props: ItemRenderProps) => ElementProps<HTMLDivElement> | undefined
  }

  /**
   * Props for the ContextMenu component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the ContextMenu component.
 */
export type ContextMenuProps = ContextMenuT.Props
