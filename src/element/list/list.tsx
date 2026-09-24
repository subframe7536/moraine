import type { Component, JSX } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'

import type { ListProps, ListT } from './list.types'

/** Headless polymorphic list with optional caller-controlled virtualization. */
export function List<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
>(props: ListProps<TItem, T, TItemElement>): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'as',
    'items',
    'itemRender',
    'virtualRender',
    'ref' as any,
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
          <Dynamic<Component<ListT.VirtualRenderProps<TItem, HTMLElement, TItemElement>>>
            component={virtualRender()}
            entries={local.items ?? []}
            scrollElement={scrollElement()}
            render={(item: TItem, index: number, rowProps?: ListT.RowProps<TItemElement>) =>
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
