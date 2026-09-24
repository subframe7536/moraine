import type { JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type {
  BaseProps,
  ElementProps,
  SlotClassValue,
  SlotStyleValue,
  ValidComponent,
} from '../../shared/types'
import type { OverlayAlign, OverlayPlacement } from '../../theme/style/style-types.ts'
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
    /** Family slot class defaults for this ContextMenu instance. */
    classes?: Classes
    /** Family slot style defaults for this ContextMenu instance. */
    styles?: Styles
  }
  export type Props = Base

  export type TriggerBase<T extends ValidComponent = 'div'> = ModalT.TriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'div'
  >

  export type ContentClasses = Omit<Classes, 'trigger'>
  export type ContentStyles = Omit<Styles, 'trigger'>
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
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
}

/**
 * Props for the ContextMenu component.
 */
export type ContextMenuProps = ContextMenuT.Props
