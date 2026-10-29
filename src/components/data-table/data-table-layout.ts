import type { Column, RowData } from '@tanstack/solid-table'
import type { Accessor, JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import type { SlotValue } from '../../provider'
import { TABLE_TEXT_ALIGN_CLASS } from '../table/table.recipe'

import type { DataTableFeatures } from './data-table-features'
import { DATA_TABLE_RESIZABLE_CELL_CLASS } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

export type DataTableSection = 'header' | 'body' | 'footer'

/** Stacking order of sticky cells. Cells pinned to a sticky edge sit one layer above. */
const STICKY_Z_INDEX: Record<DataTableSection, number> = { body: 10, header: 20, footer: 20 }

type DataTableColumn<TRow extends RowData> = Column<DataTableFeatures, TRow>

export interface DataTableLayout {
  readonly resizable: Accessor<boolean>
  readonly tableStyle: Accessor<JSX.CSSProperties>
  readonly pinnedEdge: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
  ) => 'start' | 'end' | undefined
  /** Column presentation the caller may still override (alignment, `meta.class`). */
  readonly cellClass: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    section: DataTableSection,
  ) => SlotValue
  /** Column geometry: width, sticky position, and pinned offsets. */
  readonly cellStyle: <TRow extends RowData>(
    column: DataTableColumn<TRow>,
    size: () => number,
    section: DataTableSection,
  ) => SlotValue
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
    pinnedEdge: (column) => {
      const pin = column.getIsPinned()
      if (!pin) {
        return undefined
      }
      const pinned = table().getPinnedLeafColumns(pin)
      const innermost = pin === 'start' ? pinned[pinned.length - 1] : pinned[0]
      return innermost?.id === column.id ? pin : undefined
    },
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
    cellStyle: (column, size, section) => {
      const pin = column.getIsPinned()
      const edge = stickyEdge(section)
      const isSticky = edge || Boolean(pin)
      const hasWidth = fixedLayout() || column.columnDef.size !== undefined

      return {
        style: {
          width: hasWidth ? `${size()}px` : undefined,
          position: isSticky ? 'sticky' : undefined,
          top: edge && section === 'header' ? 0 : undefined,
          bottom: edge && section === 'footer' ? 0 : undefined,
          left: pin === 'start' ? `${column.getStart('start')}px` : undefined,
          right: pin === 'end' ? `${column.getAfter('end')}px` : undefined,
          'z-index': isSticky ? STICKY_Z_INDEX[section] + (edge && pin ? 10 : 0) : undefined,
        },
      }
    },
  }
}
