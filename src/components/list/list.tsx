import type { JSX } from 'solid-js'
import { For, Show, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { VirtualContent } from '../../virtualizer/virtual-content'

import { listRecipe } from './list.recipe'
import type { ListProps } from './list.types'

/**
 * Headless polymorphic list that renders caller-defined rows from `items` through `itemRender`,
 * with optional virtualization. Use it when you own each row's markup and need a stable collection
 * surface; rows are not passed as `children`. It renders a `ul` with `role="list"` by default, so
 * render list-item semantics in each row or change the root with `as`. `emptyRender` is shown when
 * `items` is empty, and `virtualizer` (from `moraine/virtualizer`) renders only the visible rows.
 *
 * @example
 * ```tsx
 * import { List } from 'moraine'
 *
 * const inbox = [
 *   { id: '1', title: 'Deploy failed on main' },
 *   { id: '2', title: 'Review requested on #482' },
 * ]
 *
 * <List
 *   items={inbox}
 *   emptyRender={<li>Inbox is empty</li>}
 *   itemRender={(row) => <li>{row.item.title}</li>}
 * />
 * ```
 */
export function List<TItem, T extends ValidComponent = 'ul'>(
  props: ListProps<TItem, T>,
): JSX.Element {
  const [local, rest] = splitProps(props as ListProps<TItem, T> & { ref?: unknown }, [
    'as',
    'items',
    'itemRender',
    'virtualizer',
    'emptyRender',
    'ref',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const {
    slots: { root: rootSlot },
  } = useRecipe(listRecipe, local)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  return (
    <Dynamic
      component={local.as ?? 'ul'}
      role="list"
      data-slot="list"
      {...rootSlot}
      {...rest}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref, element)
      }}
    >
      <Show
        when={'emptyRender' in props && !local.items?.length}
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
        {renderWithProps(local.emptyRender!, {})}
      </Show>
    </Dynamic>
  )
}
