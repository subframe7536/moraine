import type { Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component } from 'solid-js'
import { For, Show, createMemo, createRenderEffect, on, onCleanup } from 'solid-js'

import type { ListT } from '../components/list/list.types'

import { attachRowMeasurement, createVirtualizerController } from './virtualizer-core'
import type { VirtualizerAdapterOptions } from './virtualizer-core'

export type TableVirtualizerOptions<TItem> = Omit<
  VirtualizerAdapterOptions<TItem, HTMLElement, HTMLTableRowElement>,
  'horizontal'
>

export type TableVirtualRenderProps<TItem> = Omit<
  ListT.VirtualRenderProps<TItem, HTMLElement, HTMLTableRowElement>,
  'scrollElement'
> & {
  /**
   * Scroll container for the rows; defaults to the adapter's host `tbody`. Pass an ancestor
   * element only when scrolling happens outside the table body, and pair it with an explicit
   * `scrollMargin` option.
   */
  readonly scrollElement?: HTMLElement
}

export type TableVirtualizerReturn<TItem> = {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<HTMLElement, HTMLTableRowElement> | undefined>
  /** Component mounted inside `Table.Body` to render virtualized rows. */
  readonly virtualRender: Component<TableVirtualRenderProps<TItem>>
  scrollToIndex: Virtualizer<HTMLElement, HTMLTableRowElement>['scrollToIndex']
}

/**
 * Creates a virtual renderer for semantic tables. The adapter observes its host `tbody` as the
 * scroll container and pads it with two hidden spacer rows, so rows stay in normal table flow
 * and cells keep native column alignment.
 */
export function createTableVirtualizer<TItem>(
  options: TableVirtualizerOptions<TItem>,
): TableVirtualizerReturn<TItem> {
  const controller = createVirtualizerController<TItem, HTMLElement, HTMLTableRowElement>(options)

  const VirtualRender: Component<TableVirtualRenderProps<TItem>> = (props) => {
    const renderRow = createMemo(() => props.render)
    let spacerElement: HTMLTableRowElement | undefined
    let hostElement: HTMLTableSectionElement | null | undefined
    let tableElement: HTMLTableElement | undefined
    const resolveTable = (): HTMLTableElement | null => {
      const table = spacerElement?.closest('table')
      if (table instanceof HTMLTableElement) {
        tableElement = table
      }
      return tableElement ?? null
    }
    const { virtualizer, virtualItems, totalSize } = controller.attach({
      entries: () => props.entries,
      scrollElement: () => {
        // Solid fires refs before the fragment reaches the tbody, so resolve the host lazily.
        if (hostElement === undefined && spacerElement !== undefined) {
          const host = spacerElement.closest('tbody')
          hostElement = host instanceof HTMLTableSectionElement ? host : null
        }
        return props.scrollElement ?? hostElement ?? undefined
      },
    })

    // Announce the virtualized dataset: the table declares its total row count and every
    // rendered row carries its absolute position (1-based, header rows included).
    let ownsAriaRowCount = false
    createRenderEffect(
      on(
        () => [controller.instance(), props.entries] as const,
        ([instance]) => {
          const table = instance ? resolveTable() : null
          if (!table || table.hasAttribute('aria-rowcount')) {
            return
          }
          const count =
            props.entries.length + (table.tHead?.rows.length ?? 0) + (table.tFoot?.rows.length ?? 0)
          if (count <= 0) {
            return
          }
          table.setAttribute('aria-rowcount', String(count))
          ownsAriaRowCount = true
        },
      ),
    )
    onCleanup(() => {
      if (ownsAriaRowCount) {
        tableElement?.removeAttribute('aria-rowcount')
      }
    })

    const headerRowCount = () => resolveTable()?.tHead?.rows.length ?? 0

    const padBefore = () => virtualItems[0]?.start ?? 0
    const padAfter = () => {
      const last = virtualItems[virtualItems.length - 1]
      return totalSize() - (last?.end ?? 0)
    }

    return (
      <>
        <tr
          aria-hidden="true"
          ref={(element) => {
            spacerElement = element
          }}
          style={{ height: `${padBefore()}px` }}
        />
        <For each={virtualItems}>
          {(virtualItem) => {
            const row = createMemo(
              () => ({
                index: virtualItem.index,
                item: props.entries[virtualItem.index]!,
              }),
              undefined,
              {
                equals: (prev, next) => prev?.index === next.index && prev?.item === next.item,
              },
            )

            return (
              <Show keyed when={row()}>
                {(current) => {
                  const measure = attachRowMeasurement(virtualizer)

                  return renderRow()(current.item, current.index, {
                    'aria-rowindex': current.index + headerRowCount() + 1,
                    'data-index': current.index,
                    ref: measure,
                  })
                }}
              </Show>
            )
          }}
        </For>
        <tr aria-hidden="true" style={{ height: `${padAfter()}px` }} />
      </>
    )
  }

  return {
    instance: controller.instance,
    virtualRender: VirtualRender,
    scrollToIndex: (index, scrollOptions) =>
      controller.instance()?.scrollToIndex(index, scrollOptions),
  }
}
