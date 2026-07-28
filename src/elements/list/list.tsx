import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type {
  RowProps as BaseRowProps,
  VirtualRenderProps as BaseVirtualRenderProps,
} from '../../shared/use-list-virtualizer'

export namespace ListT {
  export type RowProps<TItemElement extends HTMLElement = HTMLElement> = BaseRowProps<TItemElement>

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
  > extends BaseVirtualRenderProps<TItem, TScrollElement, TItemElement> {}

  export type Base<
    TItem,
    T extends ValidComponent = 'ul',
    TItemElement extends HTMLElement = HTMLElement,
  > = Omit<ComponentProps<T>, 'as' | 'children'> & {
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
    virtualRender?: Component<VirtualRenderProps<TItem, HTMLElement, TItemElement>>
  }

  export type Props<
    TItem,
    T extends ValidComponent = 'ul',
    TItemElement extends HTMLElement = HTMLElement,
  > = Base<TItem, T, TItemElement>
}

export type ListProps<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
> = ListT.Props<TItem, T, TItemElement>

/** Headless polymorphic list with optional caller-controlled virtualization. */
export function List<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
>(props: ListProps<TItem, T, TItemElement>): JSX.Element {
  const [local, rest] = splitProps(props as ListProps<TItem, 'ul', TItemElement>, [
    'as',
    'items',
    'itemRender',
    'virtualRender',
    'ref',
  ])
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  return (
    <Dynamic
      role="list"
      data-slot="root"
      {...rest}
      component={(local.as as ValidComponent) ?? 'ul'}
      ref={(element: HTMLUListElement) => {
        setScrollElement(() => element)
        if (typeof local.ref === 'function') {
          local.ref(element)
        }
      }}
    >
      <Show
        when={local.virtualRender}
        fallback={
          <For each={local.items}>
            {(item, index) =>
              renderComponentOrElement(local.itemRender, {
                get item() {
                  return item
                },
                get index() {
                  return index()
                },
                get props() {
                  return undefined
                },
              })
            }
          </For>
        }
      >
        {(virtualRender) => (
          <Dynamic
            component={virtualRender()}
            entries={local.items ?? []}
            scrollElement={scrollElement()}
            render={(item, index, rowProps) =>
              renderComponentOrElement(local.itemRender, {
                get item() {
                  return item
                },
                get index() {
                  return index
                },
                get props() {
                  return rowProps
                },
              })
            }
          />
        )}
      </Show>
    </Dynamic>
  )
}
