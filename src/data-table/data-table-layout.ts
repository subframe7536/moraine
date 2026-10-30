import type { Column, Header, HeaderGroup, RowData } from '@tanstack/solid-table'
import type { Accessor, JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import { TABLE_TEXT_ALIGN_CLASS } from '../components/table/table.recipe'
import type { SlotValue } from '../provider'

import type { DataTableFeatures } from './data-table-features'
import { DATA_TABLE_RESIZABLE_CELL_CLASS } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

export type DataTableSection = 'header' | 'body' | 'footer'

export type DataTablePinSide = 'start' | 'end' | false

/** Pinned regions in visual order. Header and footer rows render one segment per region. */
export const DATA_TABLE_PIN_SIDES: readonly DataTablePinSide[] = ['start', false, 'end']

/** Where a cell sits relative to the pinned regions. */
export interface DataTableCellPin {
  readonly side: Accessor<DataTablePinSide>
  /** Distance in px from the table edge the cell sticks to. */
  readonly offset: Accessor<number>
  /** Whether the cell borders the unpinned region. */
  readonly edge: Accessor<boolean>
}

/** Pinned cells sit above scrolling cells of their section. */
const PINNED_CELL_Z_INDEX = 10
/**
 * Sticky header and footer sections sit above pinned body cells. Each section is its own
 * stacking context, so its pinned cells still sit above its scrolling cells.
 */
const STICKY_SECTION_Z_INDEX = 20

type DataTableColumn<TRow extends RowData> = Column<DataTableFeatures, TRow>
type DataTableHeader<TRow extends RowData> = Header<DataTableFeatures, TRow>

export interface DataTableLayout {
  readonly resizable: Accessor<boolean>
  /** Whether the table uses `table-layout: fixed` with explicit column widths. */
  readonly fixedLayout: Accessor<boolean>
  readonly tableStyle: Accessor<JSX.CSSProperties>
  /** Pin placement of a body cell, from its leaf column. */
  readonly createColumnPin: <TRow extends RowData>(
    column: Accessor<DataTableColumn<TRow>>,
  ) => DataTableCellPin
  /** Column presentation the caller may still override (alignment, `meta.class`). */
  readonly cellClass: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    section: DataTableSection,
  ) => SlotValue
  /** Column geometry: width and pinned offsets. */
  readonly cellStyle: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    pin: DataTableCellPin,
    size: () => number,
  ) => SlotValue
  /** Sticky position of the `thead` or `tfoot`, when `sticky` covers that section. */
  readonly sectionStyle: (section: 'header' | 'footer') => JSX.CSSProperties
}

/**
 * Header or footer groups of one pinned region. TanStack builds each region separately, so a
 * group header over pinned and unpinned leaves splits into one header per region.
 */
export function pinnedHeaderGroups<TData extends RowData>(
  table: DataTableT.Instance<TData>,
  section: 'header' | 'footer',
  side: DataTablePinSide,
): HeaderGroup<DataTableFeatures, TData>[] {
  if (section === 'header') {
    return side === 'start'
      ? table.getStartHeaderGroups()
      : side === 'end'
        ? table.getEndHeaderGroups()
        : table.getCenterHeaderGroups()
  }
  return side === 'start'
    ? table.getStartFooterGroups()
    : side === 'end'
      ? table.getEndFooterGroups()
      : table.getCenterFooterGroups()
}

/** Pin placement of a header or footer cell inside the group of its pinned region. */
export function createHeaderPin<TRow extends RowData>(
  header: Accessor<DataTableHeader<TRow>>,
  side: Accessor<DataTablePinSide>,
): DataTableCellPin {
  return {
    side,
    offset: () => {
      const current = header()
      if (side() !== 'end') {
        return side() === 'start' ? current.getStart() : 0
      }
      const siblings = current.headerGroup?.headers ?? []
      const last = siblings[siblings.length - 1]
      const regionSize = last ? last.getStart() + last.getSize() : 0
      return regionSize - current.getStart() - current.getSize()
    },
    edge: () => {
      const current = header()
      const lastIndex = (current.headerGroup?.headers.length ?? 0) - 1
      return side() === 'start'
        ? current.index === lastIndex
        : side() === 'end' && current.index === 0
    },
  }
}

/**
 * Column geometry for a data table. The recipe owns cell cosmetics; this owns the inline
 * geometry that depends on live column state (sizes, pinning offsets, sticky edges).
 */
export function createDataTableLayout<TData extends RowData>(
  table: Accessor<DataTableT.Instance<TData>>,
  sticky: Accessor<DataTableT.Props['sticky']>,
  columnVirtual: Accessor<boolean>,
): DataTableLayout {
  const resizable = () => table().options.enableColumnResizing === true
  const hasPinning = createMemo(() =>
    table()
      .getAllLeafColumns()
      .some((column) => Boolean(column.getIsPinned())),
  )
  // Resizing, pinning, and column virtualization need explicit column widths and a fixed table
  // layout. Virtualized rows skip cells, so only the fixed layout keeps their columns aligned.
  const fixedLayout = () => resizable() || hasPinning() || columnVirtual()

  return {
    resizable,
    fixedLayout,
    sectionStyle: (section) => {
      const value = sticky()
      if (value !== true && value !== section) {
        return {}
      }
      // The section owns vertical stickiness, so grouped header or footer rows stack inside it
      // instead of every row sticking to the same edge.
      return {
        position: 'sticky',
        [section === 'header' ? 'top' : 'bottom']: 0,
        'z-index': STICKY_SECTION_Z_INDEX,
      }
    },
    tableStyle: () =>
      fixedLayout()
        ? {
            'table-layout': 'fixed',
            width: `${table().getTotalSize()}px`,
            'min-width': '100%',
            ...(hasPinning() ? { 'border-collapse': 'separate', 'border-spacing': '0' } : {}),
          }
        : {},
    createColumnPin: (column) => ({
      side: () => column().getIsPinned(),
      offset: () => {
        const current = column()
        const side = current.getIsPinned()
        return side === 'start'
          ? current.getStart('start')
          : side === 'end'
            ? current.getAfter('end')
            : 0
      },
      edge: () => {
        const current = column()
        const side = current.getIsPinned()
        if (!side) {
          return false
        }
        const pinned = table().getPinnedLeafColumns(side)
        const innermost = side === 'start' ? pinned[pinned.length - 1] : pinned[0]
        return innermost?.id === current.id
      },
    }),
    cellClass: (column, section) => {
      const meta = column.columnDef.meta
      return {
        class: [
          TABLE_TEXT_ALIGN_CLASS[meta?.align ?? 'left'],
          meta?.truncated && 'truncate',
          section === 'body' && resizable() && DATA_TABLE_RESIZABLE_CELL_CLASS,
          meta?.class,
        ],
      }
    },
    cellStyle: (column, pin, size) => {
      const side = pin.side()
      const hasWidth = fixedLayout() || column.columnDef.size !== undefined

      return {
        style: {
          width: hasWidth ? `${size()}px` : undefined,
          position: side ? 'sticky' : undefined,
          left: side === 'start' ? `${pin.offset()}px` : undefined,
          right: side === 'end' ? `${pin.offset()}px` : undefined,
          'z-index': side ? PINNED_CELL_Z_INDEX : undefined,
        },
      }
    },
  }
}
