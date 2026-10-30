import type { Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
} from 'solid-js'

import type { TableVirtualRenderProps } from './table-virtual-render'
import {
  attachRowMeasurement,
  createVirtualRow,
  createVirtualizerController,
} from './virtualizer-core'
import type { VirtualizerAdapterOptions, VirtualizerLayout } from './virtualizer-core'

export type TableVirtualizerOptions<TItem> = Omit<
  VirtualizerAdapterOptions<TItem, HTMLElement, HTMLTableRowElement>,
  'horizontal'
>

export type TableVirtualizerReturn<TItem> = {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<HTMLElement, HTMLTableRowElement> | undefined>
  /** Component mounted inside `Table.Body` to render virtualized rows. */
  readonly virtualRender: Component<TableVirtualRenderProps<TItem>>
  scrollToIndex: Virtualizer<HTMLElement, HTMLTableRowElement>['scrollToIndex']
}

/** Table structure outside the virtualized body, measured from the DOM. */
interface TableSections {
  readonly headerRows: number
  readonly footerRows: number
  readonly layout: Required<VirtualizerLayout>
}

const EMPTY_SECTIONS: TableSections = {
  headerRows: 0,
  footerRows: 0,
  layout: { scrollMargin: 0, scrollPaddingStart: 0, scrollPaddingEnd: 0 },
}

function sameSections(a: TableSections, b: TableSections): boolean {
  return (
    a.headerRows === b.headerRows &&
    a.footerRows === b.footerRows &&
    a.layout.scrollMargin === b.layout.scrollMargin &&
    a.layout.scrollPaddingStart === b.layout.scrollPaddingStart &&
    a.layout.scrollPaddingEnd === b.layout.scrollPaddingEnd
  )
}

/**
 * Vertically sticky sections stay in the viewport, so scrolling to a row must clear their height.
 * The section or its first cell counts as sticky when it is `position: sticky` with a vertical
 * inset; a cell pinned only horizontally does not.
 */
function stickyHeight(section: HTMLTableSectionElement | null, edge: 'top' | 'bottom'): number {
  if (!section) {
    return 0
  }
  const cell = section.rows[0]?.cells[0]
  const sticky = [section, cell].some((element) => {
    if (element === undefined) {
      return false
    }
    const style = getComputedStyle(element)
    return style.position === 'sticky' && style[edge] !== 'auto' && style[edge] !== ''
  })
  return sticky ? section.getBoundingClientRect().height : 0
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
    const resolveHost = (): HTMLTableSectionElement | undefined => {
      // Solid fires refs before the fragment reaches the tbody, so resolve the host lazily.
      if (hostElement === undefined && spacerElement !== undefined) {
        const host = spacerElement.closest('tbody')
        hostElement = host instanceof HTMLTableSectionElement ? host : null
      }
      return hostElement ?? undefined
    }

    const [sections, setSections] = createSignal(EMPTY_SECTIONS, { equals: sameSections })
    const measureSections = (table: HTMLTableElement) => {
      const host = resolveHost()
      const scroll = props.scrollElement
      // An ancestor scroller also scrolls the caption and header above the body.
      const ancestor =
        scroll !== undefined && host !== undefined && scroll !== host && scroll.contains(host)
      setSections({
        headerRows: table.tHead?.rows.length ?? 0,
        footerRows: table.tFoot?.rows.length ?? 0,
        layout: ancestor
          ? {
              scrollMargin:
                host.getBoundingClientRect().top -
                scroll.getBoundingClientRect().top +
                scroll.scrollTop -
                scroll.clientTop,
              scrollPaddingStart: stickyHeight(table.tHead, 'top'),
              scrollPaddingEnd: stickyHeight(table.tFoot, 'bottom'),
            }
          : EMPTY_SECTIONS.layout,
      })
    }

    const { virtualizer, virtualItems, totalSize } = controller.attach({
      entries: () => props.entries,
      scrollElement: () => props.scrollElement ?? resolveHost(),
      layout: () => sections().layout,
    })

    // Announce the virtualized dataset: the table declares its total row count and every row
    // carries its absolute position (1-based). Values a caller set are never overwritten: the
    // adapter only updates or removes an attribute that still holds the value it wrote.
    let writtenRowCount: string | undefined
    const writtenRowIndexes = new Map<HTMLTableRowElement, string>()
    const syncAria = (table: HTMLTableElement) => {
      const { headerRows, footerRows } = sections()
      const bodyRows = props.entries.length

      const liveCount = table.getAttribute('aria-rowcount')
      if (liveCount === null || liveCount === writtenRowCount) {
        const count = bodyRows + headerRows + footerRows
        writtenRowCount = count > 0 ? String(count) : undefined
        if (writtenRowCount) {
          table.setAttribute('aria-rowcount', writtenRowCount)
        } else {
          table.removeAttribute('aria-rowcount')
        }
      } else {
        writtenRowCount = undefined
      }

      // Header rows precede the virtual gap and footer rows follow it, so both need explicit
      // indices once body rows are missing from the DOM.
      const sectionRows = [
        ...[...(table.tHead?.rows ?? [])].map((row, index) => [row, index + 1] as const),
        ...[...(table.tFoot?.rows ?? [])].map(
          (row, index) => [row, headerRows + bodyRows + index + 1] as const,
        ),
      ]
      // Forget rows that left the table or whose index the caller has since replaced.
      const current = new Set(sectionRows.map(([row]) => row))
      for (const [row, value] of writtenRowIndexes) {
        if (!current.has(row) || row.getAttribute('aria-rowindex') !== value) {
          writtenRowIndexes.delete(row)
        }
      }
      for (const [row, index] of sectionRows) {
        const live = row.getAttribute('aria-rowindex')
        const written = writtenRowIndexes.get(row)
        if (live !== null && live !== written) {
          continue
        }
        const value = String(index)
        row.setAttribute('aria-rowindex', value)
        writtenRowIndexes.set(row, value)
      }
    }

    // Header and footer rows can change without new entries (grouped columns, conditional
    // footers), so the table structure is observed directly.
    createEffect(
      on(
        () => [controller.instance(), props.scrollElement] as const,
        ([instance]) => {
          const table = instance ? resolveTable() : null
          if (!table) {
            return
          }
          const resizeObserver =
            typeof ResizeObserver === 'undefined'
              ? undefined
              : new ResizeObserver(() => measureSections(table))
          // Sections can be replaced, so re-observe them whenever the table's children change.
          const observeSections = (mutationObserver: MutationObserver) => {
            resizeObserver?.disconnect()
            for (const element of [table.caption, table.tHead, table.tFoot]) {
              if (element) {
                resizeObserver?.observe(element)
                mutationObserver.observe(element, { childList: true })
              }
            }
          }
          const mutationObserver = new MutationObserver((records, observer) => {
            if (records.some((record) => record.target === table)) {
              observeSections(observer)
            }
            measureSections(table)
            syncAria(table)
          })
          mutationObserver.observe(table, { childList: true })
          observeSections(mutationObserver)
          measureSections(table)

          onCleanup(() => {
            mutationObserver.disconnect()
            resizeObserver?.disconnect()
          })
        },
      ),
    )

    createRenderEffect(
      on(
        () => [controller.instance(), props.entries.length, sections()] as const,
        ([instance]) => {
          const table = instance ? resolveTable() : null
          if (table) {
            syncAria(table)
          }
        },
      ),
    )
    onCleanup(() => {
      if (
        writtenRowCount !== undefined &&
        tableElement?.getAttribute('aria-rowcount') === writtenRowCount
      ) {
        tableElement.removeAttribute('aria-rowcount')
      }
      for (const [row, value] of writtenRowIndexes) {
        if (row.getAttribute('aria-rowindex') === value) {
          row.removeAttribute('aria-rowindex')
        }
      }
      writtenRowIndexes.clear()
    })

    // Virtual item offsets include `scrollMargin`; `totalSize()` does not. Spacers live inside
    // the body, so both are measured from the first row.
    const scrollMargin = () => virtualizer.options.scrollMargin
    const padBefore = () => {
      const first = virtualItems[0]
      return first ? first.start - scrollMargin() : 0
    }
    const padAfter = () => {
      const last = virtualItems[virtualItems.length - 1]
      return Math.max(totalSize() - (last ? last.end - scrollMargin() : 0), 0)
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
            const row = createVirtualRow(virtualItem, () => props.entries)

            return (
              <Show keyed when={row()}>
                {(current) => {
                  const measure = attachRowMeasurement(virtualizer)

                  return renderRow()(current.item, current.index, {
                    get 'aria-rowindex'() {
                      return current.index + sections().headerRows + 1
                    },
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
