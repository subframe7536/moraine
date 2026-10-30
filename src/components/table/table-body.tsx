import type { JSX } from 'solid-js'
import { For, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useTablePart } from './table-part'
import type { TableT } from './table.types'

/** Table body. Renders `children`, or one row per item through `itemRender`, optionally virtualized. */
export function TableBody<TItem = unknown>(props: TableT.BodyProps<TItem>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'virtualizer',
    'scrollElement',
    'children',
    'class',
    'style',
  ])
  const slots = useTablePart('body', local)

  return (
    <tbody data-slot="table-body" {...rest} {...slots.body}>
      <Show when={local.itemRender} fallback={local.children}>
        {(itemRender) => (
          <Show
            when={local.virtualizer}
            fallback={
              <For each={local.items}>
                {(item, index) => <Dynamic component={itemRender()} item={item} index={index()} />}
              </For>
            }
          >
            {(virtualizer) => (
              <Dynamic
                component={virtualizer().virtualRender}
                entries={local.items ?? []}
                scrollElement={local.scrollElement}
                render={(item, index, rowProps) => (
                  <Dynamic component={itemRender()} item={item} index={index} props={rowProps} />
                )}
              />
            )}
          </Show>
        )}
      </Show>
    </tbody>
  )
}
