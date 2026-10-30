import type { JSX } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { VirtualContent } from '../../virtualizer/virtual-content'

import { listRecipe } from './list.recipe'
import type { ListProps } from './list.types'

/** Headless polymorphic list with optional virtualization. */
export function List<TItem, T extends ValidComponent = 'ul'>(
  props: ListProps<TItem, T>,
): JSX.Element {
  const [local, rest] = splitProps(props as ListProps<TItem, T> & { ref?: unknown }, [
    'as',
    'items',
    'itemRender',
    'virtualizer',
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
      {...slots.root}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref, element)
      }}
    >
      <Show
        when={'fallback' in props && !local.items?.length}
        fallback={
          <VirtualContent<TItem>
            virtualizer={local.virtualizer}
            entries={local.items ?? []}
            scrollElement={scrollElement()}
            render={(item, index, rowProps) => {
              const ItemRender = local.itemRender
              return <ItemRender item={item} index={index} props={rowProps} />
            }}
            fallback={
              <For each={local.items}>
                {(item, index) => {
                  const ItemRender = local.itemRender
                  return <ItemRender item={item} index={index()} />
                }}
              </For>
            }
          />
        }
      >
        {(_empty) => local.fallback}
      </Show>
    </Dynamic>
  )
}
