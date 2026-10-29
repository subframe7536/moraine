import type { Column, Header, HeaderGroup, RowData } from '@tanstack/solid-table'
import type { Accessor, JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { SlotValue } from '../../provider'
import { TABLE_TEXT_ALIGN_CLASS } from '../table/table.recipe'

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

/** Stacking order of sticky cells. Cells pinned to a sticky edge sit one layer above. */
const STICKY_Z_INDEX: Record<DataTableSection, number> = { body: 10, header: 20, footer: 20 }

type DataTableColumn<TRow extends RowData> = Column<DataTableFeatures, TRow>
type DataTableHeader<TRow extends RowData> = Header<DataTableFeatures, TRow>

export interface DataTableLayout {
  readonly resizable: Accessor<boolean>
  readonly tableStyle: Accessor<JSX.CSSProperties>
  /** Pin placement of a body cell, from its leaf column. */
  readonly columnPin: <TRow extends RowData>(column: DataTableColumn<TRow>) => DataTableCellPin
  /** Column presentation the caller may still override (alignment, `meta.class`). */
  readonly cellClass: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    section: DataTableSection,
  ) => SlotValue
  /** Column geometry: width, sticky position, and pinned offsets. */
  readonly cellStyle: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    pin: DataTableCellPin,
    size: () => number,
    section: DataTableSection,
  ) => SlotValue
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
): DataTableLayout {
  const resizable = () => table().options.enableColumnResizing === true
  const hasPinning = createMemo(() =>
    table()
      .getAllLeafColumns()
      .some((column) => Boolean(column.getIsPinned())),
  )
  // Resizing and pinning both need explicit column widths and a fixed table layout.
  const fixedLayout = () => resizable() || hasPinning()

  const stickyEdge = (section: DataTableSection): boolean => {
    const value = sticky()
    return section !== 'body' && (value === true || value === section)
  }

  return {
    resizable,
    tableStyle: () =>
      fixedLayout()
        ? {
            'table-layout': 'fixed',
            width: `${table().getTotalSize()}px`,
            'min-width': '100%',
            ...(hasPinning() ? { 'border-collapse': 'separate', 'border-spacing': '0' } : {}),
          }
        : {},
    columnPin: (column) => ({
      side: () => column.getIsPinned(),
      offset: () => {
        const side = column.getIsPinned()
        return side === 'start'
          ? column.getStart('start')
          : side === 'end'
            ? column.getAfter('end')
            : 0
      },
      edge: () => {
        const side = column.getIsPinned()
        if (!side) {
          return false
        }
        const pinned = table().getPinnedLeafColumns(side)
        const innermost = side === 'start' ? pinned[pinned.length - 1] : pinned[0]
        return innermost?.id === column.id
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
    cellStyle: (column, pin, size, section) => {
      const side = pin.side()
      const edge = stickyEdge(section)
      const isSticky = edge || Boolean(side)
      const hasWidth = fixedLayout() || column.columnDef.size !== undefined

      return {
        style: {
          width: hasWidth ? `${size()}px` : undefined,
          position: isSticky ? 'sticky' : undefined,
          top: edge && section === 'header' ? 0 : undefined,
          bottom: edge && section === 'footer' ? 0 : undefined,
          left: side === 'start' ? `${pin.offset()}px` : undefined,
          right: side === 'end' ? `${pin.offset()}px` : undefined,
          'z-index': isSticky ? STICKY_Z_INDEX[section] + (edge && side ? 10 : 0) : undefined,
        },
      }
    },
  }
}
