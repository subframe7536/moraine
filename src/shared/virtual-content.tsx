import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ListVirtualizer, VirtualRowProps } from './virtual'

/**
 * Mounts a host's `virtualizer` over its entries, or renders `fallback` when there is none.
 * Shared by list-style hosts so each one wires the virtual renderer the same way.
 */
export function VirtualContent<TEntry>(props: {
  virtualizer: ListVirtualizer<TEntry> | undefined
  entries: readonly TEntry[]
  scrollElement: HTMLElement | undefined
  render: (entry: TEntry, index: number, rowProps: VirtualRowProps) => JSX.Element
  /** Non-virtual content. */
  fallback: JSX.Element
}): JSX.Element {
  return (
    <Show when={props.virtualizer} fallback={props.fallback}>
      {(virtualizer) => (
        <Dynamic
          component={virtualizer().virtualRender}
          entries={props.entries}
          scrollElement={props.scrollElement}
          render={props.render}
        />
      )}
    </Show>
  )
}
