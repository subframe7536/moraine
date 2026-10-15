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
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../base/trigger'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export namespace DropdownMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DropdownMenuStyleSlot<T>
  export type Variant = DropdownMenuStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item extends OverlayMenuSharedItem<Item> {}
  export type ItemRenderProps = OverlayMenuSharedItemRenderProps<Item>

  /**
   * Base props for the DropdownMenu component.
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
     * @default 'bottom'
     */
    placement?: OverlayPlacement
    /** Alignment along the cross axis.
     * @default 'start'
     */
    align?: OverlayAlign
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variant, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

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
   * Props for the DropdownMenu component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the DropdownMenu component.
 */
export type DropdownMenuProps = DropdownMenuT.Props
