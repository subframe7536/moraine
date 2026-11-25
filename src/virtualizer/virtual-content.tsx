import type { JSX } from '@solidjs/web'
import { Show, dynamicComponent } from 'solid-js'

import type { ListVirtualizer, VirtualRowProps } from './virtualizer.types'
// Imported by the main entry: it must not import `@tanstack/virtual-core` or a module that does.

/**
 * Mounts a host's `virtualizer` over its entries, or renders `fallback` when there is none.
 * Shared by list-style hosts so each one wires the virtual renderer the same way.
 */
export function VirtualContent<TEntry>(props: {
  virtualizer: ListVirtualizer<TEntry> | undefined
  entries: ReadonlyArray<TEntry>
  scrollElement: HTMLElement | undefined
  render: (entry: TEntry, index: number, rowProps: VirtualRowProps) => JSX.Element
  /** Non-virtual content. */
  fallback: JSX.Element
}): JSX.Element {
  return (
    <Show when={props.virtualizer} fallback={props.fallback}>
      {(virtualizer) => {
        const VirtualRows = dynamicComponent(() => virtualizer().virtualRender)
        return (
          <VirtualRows
            entries={props.entries}
            scrollElement={props.scrollElement}
            render={props.render}
          />
        )
      }}
    </Show>
  )
}
