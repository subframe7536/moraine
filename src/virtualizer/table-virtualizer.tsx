import type { Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
} from 'solid-js'

import type {
  TableVirtualColumnLayout,
  TableVirtualColumnWindow,
  TableVirtualRenderProps,
} from './table-virtual-render'
import {
  attachRowMeasurement,
  createSharedElementOffsetObserver,
  createVirtualRow,
  createVirtualizerController,
} from './virtualizer-core'
import type { VirtualizerAdapterOptions, VirtualizerLayout } from './virtualizer-core'

/** Options of the horizontal column virtualizer. */
export type TableVirtualizerColumnOptions<TColumn> = Omit<
  VirtualizerAdapterOptions<TColumn, HTMLElement, HTMLTableCellElement>,
  'horizontal' | 'estimateSize' | 'scrollMargin' | 'scrollPaddingStart' | 'scrollPaddingEnd'
> & {
  /**
   * Width in px of a column. Defaults to the host's `columnSize` (DataTable passes each column's
   * TanStack size), then 150. Columns are never measured, so widths must be exact.
   */
  estimateSize?: (column: TColumn, index: number) => number
}

export type TableVirtualizerOptions<TItem, TColumn = unknown> = Omit<
  VirtualizerAdapterOptions<TItem, HTMLElement, HTMLTableRowElement>,
  'horizontal'
> & {
  /**
   * Virtualizes columns as well as rows. Only body cells of the `columns` passed to the render
   * component are virtualized; render header and footer cells, and cells outside `columns`
   * (such as pinned ones), in full.
   */
  columns?: TableVirtualizerColumnOptions<TColumn>
}

export type TableVirtualizerReturn<TItem, TColumn = unknown> = {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<HTMLElement, HTMLTableRowElement> | undefined>
  /** Current column virtualizer instance when the `columns` option is set. */
  readonly columnInstance: Accessor<Virtualizer<HTMLElement, HTMLTableCellElement> | undefined>
  /** Component mounted inside `Table.Body` to render virtualized rows. */
  readonly virtualRender: Component<TableVirtualRenderProps<TItem, TColumn>>
  /**
   * Columns to render in each body row, while the render component is mounted with the
   * `columns` option set; otherwise `undefined`.
   */
  readonly columnWindow: Accessor<TableVirtualColumnWindow | undefined>
  scrollToIndex: Virtualizer<HTMLElement, HTMLTableRowElement>['scrollToIndex']
  scrollToColumn: Virtualizer<HTMLElement, HTMLTableCellElement>['scrollToIndex']
}

/** Column width used when neither `columns.estimateSize` nor the host's `columnSize` is set. */
const DEFAULT_COLUMN_SIZE = 150

type SectionLayout = Required<
  Pick<VirtualizerLayout, 'scrollMargin' | 'scrollPaddingStart' | 'scrollPaddingEnd'>
>

/** Table structure outside the virtualized body, measured from the DOM. */
interface TableSections {
  readonly headerRows: number
  readonly footerRows: number
  readonly layout: SectionLayout
}

const EMPTY_SECTIONS: TableSections = {
  headerRows: 0,
  footerRows: 0,
  layout: { scrollMargin: 0, scrollPaddingStart: 0, scrollPaddingEnd: 0 },
}

function sameColumnWindow(
  a: TableVirtualColumnWindow | undefined,
  b: TableVirtualColumnWindow | undefined,
): boolean {
  if (a === undefined || b === undefined) {
    return a === b
  }
  return (
    a.skippedBefore === b.skippedBefore &&
    a.skippedAfter === b.skippedAfter &&
    a.items.length === b.items.length &&
    a.items.every((item, index) => {
      const other = b.items[index]!
      return (
        item.index === other.index &&
        item.start === other.start &&
        item.size === other.size &&
        item.key === other.key
      )
    })
  )
}

function sameColumnLayout(a: VirtualizerLayout, b: VirtualizerLayout): boolean {
  return (
    a.scrollMargin === b.scrollMargin &&
    a.scrollPaddingStart === b.scrollPaddingStart &&
    a.scrollPaddingEnd === b.scrollPaddingEnd &&
    a.isRtl === b.isRtl
  )
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
 *
 * With the `columns` option, it also virtualizes body cells horizontally: `columnWindow` lists
 * the columns to render, and body rows fill the skipped columns with `colSpan` placeholder cells.
 */
export function createTableVirtualizer<TItem, TColumn = unknown>(
  options: TableVirtualizerOptions<TItem, TColumn>,
): TableVirtualizerReturn<TItem, TColumn> {
  // One scroll listener feeds both axes, so a scroll event updates rows and columns in one batch.
  const observeElementOffset = createSharedElementOffsetObserver()
  const rowOptions = mergeProps({ observeElementOffset }, options)
  const controller = createVirtualizerController<TItem, HTMLElement, HTMLTableRowElement>(
    rowOptions,
  )
  // `columns` is read once: the column virtualizer exists for the lifetime of this virtualizer.
  const columnOptions = options.columns
  let columnController:
    | ReturnType<typeof createVirtualizerController<TColumn, HTMLElement, HTMLTableCellElement>>
    | undefined
  if (columnOptions) {
    const horizontalOptions = mergeProps({ observeElementOffset }, columnOptions, {
      horizontal: true,
      estimateSize: columnOptions.estimateSize ?? (() => DEFAULT_COLUMN_SIZE),
    })
    columnController = createVirtualizerController<TColumn, HTMLElement, HTMLTableCellElement>(
      horizontalOptions,
    )
  }
  // Holds the mounted adapter's window memo. Reading the memo, instead of copying its value in an
  // effect, keeps rows that mount during a scroll on the current window.
  const [windowSource, setWindowSource] = createSignal<
    Accessor<TableVirtualColumnWindow> | undefined
  >()
  const columnWindow = (): TableVirtualColumnWindow | undefined => windowSource()?.()

  const VirtualRender: Component<TableVirtualRenderProps<TItem, TColumn>> = (props) => {
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

    const columnEntries = (): readonly TColumn[] => props.columns ?? []
    const [columnRtl, setColumnRtl] = createSignal(false)
    const columnLayout = createMemo(
      (): VirtualizerLayout => {
        const layout: TableVirtualColumnLayout = props.columnLayout ?? {}
        return {
          scrollMargin: layout.scrollMargin ?? 0,
          scrollPaddingStart: layout.scrollPaddingStart ?? 0,
          scrollPaddingEnd: layout.scrollPaddingEnd ?? 0,
          isRtl: columnRtl(),
        }
      },
      undefined,
      { equals: sameColumnLayout },
    )
    const columnState = columnController?.attach({
      entries: columnEntries,
      scrollElement: () => props.scrollElement ?? resolveHost(),
      layout: columnLayout,
      estimateSize: (column, index) =>
        columnOptions?.estimateSize?.(column, index) ??
        props.columnSize?.(column, index) ??
        DEFAULT_COLUMN_SIZE,
    })

    if (columnController && columnState) {
      // Columns flow right to left in an RTL table, and its `scrollLeft` counts down from 0.
      createEffect(
        on(columnController.instance, (instance) => {
          const element = instance?.scrollElement
          if (element) {
            setColumnRtl(getComputedStyle(element).direction === 'rtl')
          }
        }),
      )

      const currentWindow = createMemo(
        (): TableVirtualColumnWindow => {
          const count = columnEntries().length
          // The window can still point past the end right after columns shrink.
          const items = columnState.virtualItems
            .filter((item) => item.index < count)
            .map((item) => ({
              index: item.index,
              start: item.start,
              size: item.size,
              key: item.key,
            }))
          const first = items[0]
          const last = items[items.length - 1]
          return {
            items,
            skippedBefore: first ? first.index : 0,
            skippedAfter: last ? count - last.index - 1 : count,
          }
        },
        undefined,
        { equals: sameColumnWindow },
      )
      setWindowSource(() => currentWindow)
      onCleanup(() => setWindowSource((source) => (source === currentWindow ? undefined : source)))
      // A user effect, not a render effect: it never runs on the server and runs after hydration,
      // so the host's column-dependent markup (such as DataTable's `colgroup`) matches the server.
      createEffect(
        on(
          () => props.onColumnWindow,
          (handOff) => {
            handOff?.(currentWindow)
            onCleanup(() => handOff?.(undefined))
          },
        ),
      )
    }

    // Announce the virtualized dataset: the table declares its total row count and every row
    // carries its absolute position (1-based). Values a caller set are never overwritten: the
    // adapter only updates or removes an attribute that still holds the value it wrote.
    let writtenRowCount: string | undefined
    let writtenColCount: string | undefined
    const writtenRowIndexes = new Map<HTMLTableRowElement, string>()
    const syncAria = (table: HTMLTableElement) => {
      const { headerRows, footerRows } = sections()
      const bodyRows = props.entries.length

      if (columnController) {
        // Count only the virtualized columns; a host that renders more cells sets its own value.
        const liveColCount = table.getAttribute('aria-colcount')
        if (liveColCount === null || liveColCount === writtenColCount) {
          const count = columnEntries().length
          writtenColCount = count > 0 ? String(count) : undefined
          if (writtenColCount) {
            table.setAttribute('aria-colcount', writtenColCount)
          } else {
            table.removeAttribute('aria-colcount')
          }
        } else {
          writtenColCount = undefined
        }
      }

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
        () =>
          [
            controller.instance(),
            props.entries.length,
            sections(),
            columnEntries().length,
          ] as const,
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
      if (
        writtenColCount !== undefined &&
        tableElement?.getAttribute('aria-colcount') === writtenColCount
      ) {
        tableElement.removeAttribute('aria-colcount')
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
    columnInstance: () => columnController?.instance(),
    virtualRender: VirtualRender,
    columnWindow,
    scrollToIndex: (index, scrollOptions) =>
      controller.instance()?.scrollToIndex(index, scrollOptions),
    scrollToColumn: (index, scrollOptions) =>
      columnController?.instance()?.scrollToIndex(index, scrollOptions),
  }
}
