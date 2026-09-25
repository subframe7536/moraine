import type { Component, JSX } from 'solid-js'
import { For, Show, createComponent, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils.ts'

import type { ListProps, ListT } from './list.types.ts'

/** Headless polymorphic list with optional caller-controlled virtualization. */
export function List<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
>(props: ListProps<TItem, T, TItemElement>): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props as ListProps<TItem, T, TItemElement> & { ref?: unknown }, [
    'as',
    'items',
    'itemRender',
    'virtualRender',
    'ref',
    'class',
    'style',
  ])
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  return (
    <Dynamic
      role="list"
      data-slot="list"
      {...rest}
      component={local.as ?? 'ul'}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref, element)
      }}
      class={cn(local.class)}
      style={local.style}
    >
      <Show
        when={local.virtualRender}
        fallback={
          <For each={local.items}>
            {(item, index) =>
              createComponent(local.itemRender, {
                item,
                get index() {
                  return index()
                },
              })
            }
          </For>
        }
      >
        {(virtualRender) => (
          <Dynamic<Component<ListT.VirtualRenderProps<TItem, HTMLElement, TItemElement>>>
            component={virtualRender()}
            entries={local.items ?? []}
            scrollElement={scrollElement()}
            render={(item: TItem, index: number, rowProps?: ListT.RowProps<TItemElement>) =>
              createComponent(local.itemRender, {
                item,
                index,
                props: rowProps,
              })
            }
          />
        )}
      </Show>
    </Dynamic>
  )
}
