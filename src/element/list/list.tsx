import type { Component, JSX } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'

import type { ListProps, ListT } from './list.types'

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
    'fallback',
    'ref',
    'class',
    'style',
  ])
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
      class={cn(local.class)}
      style={local.style}
    >
      <Show
        when={'fallback' in props && !local.items?.length}
        fallback={
          <Show
            when={local.virtualRender}
            fallback={
              <For each={local.items}>
                {(item, index) => <local.itemRender item={item} index={index()} />}
              </For>
            }
          >
            {(virtualRender) => (
              <Dynamic<Component<ListT.VirtualRenderProps<TItem, HTMLElement, TItemElement>>>
                component={virtualRender()}
                entries={local.items ?? []}
                scrollElement={scrollElement()}
                render={(item: TItem, index: number, rowProps?: ListT.RowProps<TItemElement>) => (
                  <local.itemRender item={item} index={index} props={rowProps} />
                )}
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
