import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'
import { For, Show, createSignal, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

export namespace ListT {
  export type RowProps<TItemElement extends HTMLElement = HTMLElement> = Omit<
    JSX.HTMLAttributes<TItemElement>,
    'ref'
  > & {
    ref?: (element: TItemElement) => void
    'data-index'?: number | string
  }

  export interface ItemRenderContext<TItem, TItemElement extends HTMLElement = HTMLElement> {
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
    /** Renders an item and forwards optional attributes to its final row element. */
    render: (item: TItem, index: number, props?: RowProps<TItemElement>) => JSX.Element
  }

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
    itemRender: (context: ItemRenderContext<TItem, TItemElement>) => JSX.Element
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
  let rootElement: HTMLElement | undefined
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  onMount(() => {
    setScrollElement(rootElement)
  })

  return (
    <Dynamic
      {...rest}
      component={(local.as as ValidComponent) ?? 'ul'}
      ref={(element: any) => {
        rootElement = element
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
              local.itemRender({
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
              local.itemRender({
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
