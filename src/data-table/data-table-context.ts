import type { Column, RowData } from '@tanstack/solid-table'
import type { Accessor } from 'solid-js'

import type { SlotBinding, SlotOverrides, UseRecipeResult } from '../provider'
import { createContextProvider } from '../shared/create-context-provider'
import type { DataAttributeBag } from '../theme/style-contract'
import type { TableVirtualColumnWindow } from '../virtualizer/virtualizer.types'

import type { DataTableFeatures } from './data-table-features'
import type { DataTableCellPin, DataTableSection } from './data-table-layout'
import type { dataTableRecipe } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

type DataTableRecipe = UseRecipeResult<typeof dataTableRecipe>

export interface DataTableContextValue {
  readonly slots: DataTableRecipe['slots']
  readonly slotWith: DataTableRecipe['slotWith']
  readonly slotOverrides: SlotOverrides
  readonly messages: Accessor<DataTableT.Messages>
  /** Whether rows render through `virtualizer`. Virtual tables show every row in one scroll. */
  readonly virtual: Accessor<boolean>
  /**
   * Center columns to render in body rows while the virtualizer virtualizes columns; otherwise
   * `undefined`, and body rows render every column.
   */
  readonly columnWindow: Accessor<TableVirtualColumnWindow | undefined>
  /** Whether `columnWindow` is set; stays stable while the window slides. */
  readonly columnVirtual: Accessor<boolean>
  /** One-based position of a visible leaf column, for `aria-colindex`. */
  readonly columnIndex: (columnId: string) => number | undefined
  /** Whether the pagination toolbar is shown, so row actions such as select-all cover one page. */
  readonly paginated: Accessor<boolean>
  /** Whether columns can be resized interactively. */
  readonly resizable: Accessor<boolean>
  /** Number of visible leaf columns, at least 1, for full-width cells. */
  readonly colSpan: Accessor<number>
  /**
   * Id of the tree column: the first visible leaf column after the generated selection and
   * expand columns. Its body cells indent by row depth.
   */
  readonly treeColumnId: Accessor<string | undefined>
  /** Shared `name` of the single-selection radios, so they form one native radio group. */
  readonly selectionName: string
  /** Slot binding for a `head` or `cell` of `column` in the given table section. */
  readonly cellSlot: <TData extends RowData>(
    slot: 'head' | 'cell',
    column: Column<DataTableFeatures, TData>,
    pin: DataTableCellPin,
    size: () => number,
    section: DataTableSection,
    options?: { data?: DataAttributeBag },
  ) => SlotBinding
  /** Slot binding for the `header` or `footer` section, including its sticky position. */
  readonly sectionSlot: (section: 'header' | 'footer') => SlotBinding
  /** Pin placement of a body cell, from its leaf column. */
  readonly createColumnPin: <TData extends RowData>(
    column: Accessor<Column<DataTableFeatures, TData>>,
  ) => DataTableCellPin
}

export const [DataTableProvider, useDataTableContext] =
  /* @__PURE__ */ createContextProvider<DataTableContextValue>('DataTable')
