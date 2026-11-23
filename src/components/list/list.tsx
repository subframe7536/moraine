import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { For, Show, createEffect, createMemo, createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import { createScrollMetrics } from '../../shared/scroll-metrics'
import type { ValidComponent } from '../../shared/types'
import { callRef, pick } from '../../shared/utils'
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
  const local = pick(
    props as ListProps<TItem, T> & { ref?: unknown },
    'as',
    'items',
    'itemRender',
    'virtualizer',
    'emptyRender',
    'scrollThreshold',
    'onTopReached',
    'onBottomReached',
    'ref',
    'classes',
    'styles',
    'class',
    'style',
  )
  const rest = omit(
    props as ListProps<TItem, T> & { ref?: unknown },
    'as',
    'items',
    'itemRender',
    'virtualizer',
    'emptyRender',
    'scrollThreshold',
    'onTopReached',
    'onBottomReached',
    'ref',
    'classes',
    'styles',
    'class',
    'style',
  )
  const {
    slots: { root: rootSlot },
  } = useRecipe(listRecipe, local)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()
  const metrics = createScrollMetrics(scrollElement, () => {})

  const edges = createMemo(
    () => {
      const { extent, position } = metrics().y
      const threshold = Math.max(0, local.scrollThreshold ?? 0)
      // Scroll positions may be fractional while client and scroll sizes are integers.
      return {
        top: extent > 0 && position <= threshold,
        bottom: extent > 0 && extent - position <= threshold + 1,
      }
    },
    { equals: (a, b) => a.top === b.top && a.bottom === b.bottom },
  )

  createEffect(
    edges,
    (current, previous) => {
      if (!previous) {
        return
      }
      if (current.top && !previous.top) {
        local.onTopReached?.()
      }
      if (current.bottom && !previous.bottom) {
        local.onBottomReached?.()
      }
    },
    { defer: true },
  )

  return (
    <Dynamic
      component={local.as ?? 'ul'}
      role="list"
      data-slot="list"
      {...rootSlot}
      {...(rest as any)}
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
              return <ItemRender item={item} index={index} rowProps={rowProps} />
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
