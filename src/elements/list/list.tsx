import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'
import { For, Show, createEffect, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { VirtualRenderT } from '../../shared/use-virtual-render'
import { useVirtualRender } from '../../shared/use-virtual-render'

export namespace ListT {
  export interface ItemRenderContext<TItem, TItemElement extends HTMLElement = HTMLElement> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Current index in the complete item collection. */
    readonly index: number
    /** Attributes supplied by a virtual renderer for the final row element. */
    readonly props: VirtualRenderT.RowProps<TItemElement> | undefined
  }

  export type VirtualRenderProps<
    TItem,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > = VirtualRenderT.Context<TItem, TScrollElement, TItemElement>

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

function callRef<T extends HTMLElement>(
  ref: T | ((element: T) => void) | undefined,
  element: T,
): void {
  if (typeof ref === 'function') {
    ref(element)
  }
}

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
  const items = () => local.items ?? []
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()
  const virtualRendering = useVirtualRender<TItem, HTMLElement, TItemElement>({
    entries: items,
    render: (item, index, rowProps) =>
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
      }),
  })
  createEffect(() => virtualRendering.setScrollElement(scrollElement()))

  return (
    <Dynamic
      {...rest}
      component={(local.as as ValidComponent) ?? 'ul'}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref as HTMLElement | ((element: HTMLElement) => void) | undefined, element)
      }}
    >
      <Show
        when={local.virtualRender}
        fallback={
          <For each={items()}>
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
            entries={virtualRendering.context.entries}
            scrollElement={virtualRendering.context.scrollElement}
            render={virtualRendering.context.render}
          />
        )}
      </Show>
    </Dynamic>
  )
}
