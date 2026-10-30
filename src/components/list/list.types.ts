import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ListStyleSlot, ListStyleVariants } from './list.style-types'

export namespace ListT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ListStyleSlot<T>
  export type Variants = ListStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type RowProps<TItemElement extends HTMLElement = HTMLElement> = Omit<
    JSX.HTMLAttributes<TItemElement>,
    'ref' | 'style'
  > & {
    ref?: (element: TItemElement) => void
    'data-index'?: number | string
    /** Set on every row by table adapters, which stripe it from `data-even` instead of DOM order. */
    'data-virtual-row'?: string
    /** Set on odd indexes (the 2nd, 4th, ... rows) by table adapters, for striping. */
    'data-even'?: string
    /** Set on the last entry by table adapters, whose trailing spacer row is the last child. */
    'data-last'?: string
    style?: JSX.CSSProperties
  }

  export interface ItemRenderProps<TItem, TItemElement extends HTMLElement = HTMLElement> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Current index in the complete item collection. */
    readonly index: number
    /** Attributes supplied by a virtual renderer for the final row element. */
    readonly props?: RowProps<TItemElement>
  }

  export interface VirtualRenderProps<
    TItem,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > {
    /** Complete reactive collection, including structural entries such as group labels. */
    readonly entries: readonly TItem[]
    /** Current scroll container, or undefined while it is not mounted. */
    readonly scrollElement: TScrollElement | undefined
    render: (item: TItem, index: number, props?: RowProps<TItemElement>) => JSX.Element
  }

  export type Base<TItem, TItemElement extends HTMLElement = HTMLElement> = {
    /** Content rendered inside the list when the collection is empty. */
    fallback?: JSX.Element
    /** Reactive collection rendered by the list. */
    items?: readonly TItem[]
    /** Renders one collection item. */
    itemRender: Component<ItemRenderProps<TItem, TItemElement>>
    /** Replaces normal iteration with caller-controlled virtual rendering. */
    virtualRender?: Component<VirtualRenderProps<TItem, HTMLElement, TItemElement>>
  }

  export type Props<
    TItem,
    T extends ValidComponent = 'ul',
    TItemElement extends HTMLElement = HTMLElement,
  > = BaseProps<
    T,
    Base<TItem, TItemElement> & {
      /** Root element or component. @default 'ul' */
      as?: T
    },
    Variants,
    Classes,
    Styles,
    'ul'
  >
}

export type ListProps<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
> = ListT.Props<TItem, T, TItemElement>
