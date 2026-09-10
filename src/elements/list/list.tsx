import type { Component, JSX, ValidComponent } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { RowProps as BaseRowProps } from '../../shared/use-list-virtualizer'

import type { ListProps, ListT } from './list.types'

/** Headless polymorphic list with optional caller-controlled virtualization. */
export function List<
  TItem,
  T extends ValidComponent = 'ul',
  TItemElement extends HTMLElement = HTMLElement,
>(props: ListProps<TItem, T, TItemElement>): JSX.Element {
  const cn = useCn()
  type RuntimeListProps = ListProps<TItem, T, TItemElement> & {
    ref?: (element: TItemElement | undefined) => void
  }
  const [local, rest] = splitProps(props as RuntimeListProps, [
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
      data-slot="root"
      {...rest}
      component={(local.as as ValidComponent) ?? 'ul'}
      ref={(element: HTMLUListElement) => {
        setScrollElement(() => element)
        if (typeof local.ref === 'function') {
          local.ref(element)
        }
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
            render={(item: TItem, index: number, rowProps?: BaseRowProps<TItemElement>) =>
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
