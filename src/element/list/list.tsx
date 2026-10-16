import type { Component, JSX } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'

import { listRecipe } from './list.recipe'
import type { ListProps, ListT } from './list.types'

/** Headless polymorphic list with optional caller-controlled virtualization. */
export function List<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
>(props: ListProps<TItem, T, TItemElement>): JSX.Element {
  const [local, rest] = splitProps(props as ListProps<TItem, T, TItemElement> & { ref?: unknown }, [
    'as',
    'items',
    'itemRender',
    'virtualRender',
    'fallback',
    'ref',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const { slots } = useRecipe(listRecipe, local)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  return (
    <Dynamic
      component={local.as ?? 'ul'}
      role="list"
      data-slot="list"
      {...rest}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref, element)
      }}
      {...slots.root}
    >
      <Show
        when={'fallback' in props && !local.items?.length}
        fallback={
          <Show
            when={local.virtualRender}
            fallback={
              <For each={local.items}>
                {(item, index) => {
                  const ItemRender = local.itemRender
                  return <ItemRender item={item} index={index()} />
                }}
              </For>
            }
          >
            {(virtualRender) => (
              <Dynamic<Component<ListT.VirtualRenderProps<TItem, HTMLElement, TItemElement>>>
                component={virtualRender()}
                entries={local.items ?? []}
                scrollElement={scrollElement()}
                render={(item: TItem, index: number, rowProps?: ListT.RowProps<TItemElement>) => {
                  if (typeof local.itemRender === 'function') {
                    const ItemRender = local.itemRender as Component<
                      ListT.ItemRenderProps<TItem, TItemElement>
                    >
                    return <ItemRender item={item} index={index} props={rowProps} />
                  }
                  return local.itemRender
                }}
              />
            )}
          </Show>
        }
      >
        {(_empty) => local.fallback}
      </Show>
    </Dynamic>
  )
}
