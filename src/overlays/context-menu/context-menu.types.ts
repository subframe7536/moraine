import type { JSX, ValidComponent } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
} from '../base/menu'
import type { ModalT } from '../modal/modal.types'

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
    | 'placement'
    | 'gutter'
    | 'shift'
    | 'preventScroll'
    | 'overflowPadding'
  > {
    children?: JSX.Element
  }
  export interface ContentBase extends Omit<
    OverlayMenuRootProps<Item>,
    keyof Base | 'classes' | 'styles' | 'itemProps' | 'itemRender' | 'contentProps'
  > {
    /** Custom renderer for individual items. */
    itemRender?: ComponentOrElement<ItemRenderProps>
    /** Additional attributes for an interactive menu item. */
    itemProps?: (props: ItemRenderProps) => ElementProps<HTMLDivElement> | undefined
  }

  /**
   * Props for the ContextMenu component.
   */
  export type TriggerProps<T extends ValidComponent = 'div'> = ModalT.TriggerProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, Classes, Styles>
  export type Props = Base
}

/**
 * Props for the ContextMenu component.
 */
export interface ContextMenuProps extends ContextMenuT.Props {}
