import type { Component, JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, ValidComponent } from '../../shared/types'

export namespace ListT {
  export type Kind = 'single'

  export type Variant = never
  export type RowProps<TItemElement extends HTMLElement = HTMLElement> = Omit<
    JSX.HTMLAttributes<TItemElement>,
    'ref' | 'style'
  > & {
    ref?: (element: TItemElement) => void
    'data-index'?: number | string
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

  export type Base<
    TItem,
    T extends ValidComponent = 'ul',
    TItemElement extends HTMLElement = HTMLElement,
  > = {
    /**
     * Root element or component.
     * @default 'ul'
     */
    as?: T
    /** Reactive collection rendered by the list. */
    items?: readonly TItem[]
    /** Renders one collection item. */
    itemRender: ComponentOrElement<ItemRenderProps<TItem, TItemElement>>
    /** Replaces normal iteration with caller-controlled virtual rendering. */
    virtualRender?: Component<VirtualRenderProps<TItem, any, TItemElement>>
    /** Receives the mounted list element. */
    ref?: (element: any) => void
  }

  export type Props<
    TItem,
    T extends ValidComponent = 'ul',
    TItemElement extends HTMLElement = HTMLElement,
  > = BaseProps<T, Base<TItem, T, TItemElement>, Variant, never, never, 'ul'>
}

export type ListProps<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
> = ListT.Props<TItem, T, TItemElement>
