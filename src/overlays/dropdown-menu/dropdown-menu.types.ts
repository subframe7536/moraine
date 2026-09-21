import type { JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type {
  BaseProps,
  ElementProps,
  SlotClassValue,
  SlotStyleValue,
  ValidComponent,
} from '../../shared/types'
import type {
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
} from '../base/menu'
import type { ModalT } from '../modal/modal.types'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export namespace DropdownMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DropdownMenuStyleSlot<T>
  export type Variant = DropdownMenuStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type ContentClasses = Omit<Classes, 'trigger'>
  export type ContentStyles = Omit<Styles, 'trigger'>
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
    | 'placement'
    | 'gutter'
    | 'shift'
    | 'preventScroll'
    | 'overflowPadding'
  > {
    children?: JSX.Element
    /** Family slot class defaults for this DropdownMenu instance. */
    classes?: Classes
    /** Family slot style defaults for this DropdownMenu instance. */
    styles?: Styles
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
   * Props for the DropdownMenu component.
   */
  export type TriggerProps<T extends ValidComponent = 'button'> = ModalT.TriggerProps<T>
  export type ContentProps = BaseProps<'div', ContentBase, Variant, ContentClasses, ContentStyles>
  export type Props = Base
}

/**
 * Props for the DropdownMenu component.
 */
export interface DropdownMenuProps extends DropdownMenuT.Props {}
