import type { VirtualItem, Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, JSX } from 'solid-js'
import { For, Show, createMemo, onCleanup } from 'solid-js'

export interface VirtualRowEntry<TItem> {
  readonly index: number
  readonly item: TItem
}

/**
 * Pairs a virtual item with its entry. Returns `undefined` while the virtual window still points
 * past the end of shrunken entries, so callers never render a row for a missing item.
 */
export function createVirtualRow<TItem>(
  virtualItem: VirtualItem,
  entries: () => readonly TItem[],
): Accessor<VirtualRowEntry<TItem> | undefined> {
  const row = createMemo(
    () => {
      const current = entries()
      const index = virtualItem.index
      return index < current.length ? { index, item: current[index]! } : undefined
    },
    undefined,
    {
      equals: (prev, next) => prev?.index === next?.index && prev?.item === next?.item,
    },
  )
  return row
}

/** Registers row unmeasurement on cleanup and returns a deferred measurement ref. */
export function attachRowMeasurement<
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(virtualizer: Virtualizer<TScrollElement, TItemElement>): (element: TItemElement) => void {
  onCleanup(() => {
    queueMicrotask(() => virtualizer.measureElement(null))
  })
  return (element: TItemElement) => {
    // Solid invokes spread refs before all following attributes are applied.
    // Defer measurement so data attributes, styles, and children affect its size.
    queueMicrotask(() => {
      if (element.isConnected) {
        virtualizer.measureElement(element)
      }
    })
  }
}

/**
 * Renders the current window: one row per virtual item, measured through the ref passed to
 * `rowProps`. Items past the end of shrunken entries render nothing.
 */
export function VirtualRows<TItem, TItemElement extends HTMLElement, TRowProps>(props: {
  virtualizer: Virtualizer<HTMLElement, TItemElement>
  virtualItems: readonly VirtualItem[]
  entries: readonly TItem[]
  render: (item: TItem, index: number, rowProps: TRowProps) => JSX.Element
  /** Builds the row attributes; it must pass `measure` on as the row `ref`. */
  rowProps: (
    row: VirtualRowEntry<TItem>,
    virtualItem: VirtualItem,
    measure: (element: TItemElement) => void,
  ) => TRowProps
}): JSX.Element {
  const renderRow = createMemo(() => props.render)

  return (
    <For each={props.virtualItems}>
      {(virtualItem) => {
        const row = createVirtualRow(virtualItem, () => props.entries)

        return (
          <Show keyed when={row()}>
            {(current) => {
              const measure = attachRowMeasurement(props.virtualizer)
              return renderRow()(
                current.item,
                current.index,
                props.rowProps(current, virtualItem, measure),
              )
            }}
          </Show>
        )
      }}
    </For>
  )
}
