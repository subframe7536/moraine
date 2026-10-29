import type { Column, RowData } from '@tanstack/solid-table'
import type { Accessor } from 'solid-js'

import type { SlotBinding, SlotOverrides, UseRecipeResult } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'

import type { DataTableFeatures } from './data-table-features'
import type { DataTableSection } from './data-table-layout'
import type { dataTableRecipe } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

type DataTableRecipe = UseRecipeResult<typeof dataTableRecipe>

export interface DataTableContextValue {
  readonly slots: DataTableRecipe['slots']
  readonly slotWith: DataTableRecipe['slotWith']
  readonly slotOverrides: SlotOverrides
  readonly messages: Accessor<DataTableT.Messages>
  /** Whether rows render through `virtualRender`. Virtual tables show every row in one scroll. */
  readonly virtual: Accessor<boolean>
  /** Whether columns can be resized interactively. */
  readonly resizable: Accessor<boolean>
  /** Number of visible leaf columns, at least 1, for full-width cells. */
  readonly colSpan: Accessor<number>
  /** Slot binding for a `head` or `cell` of `column` in the given table section. */
  readonly cellSlot: <TData extends RowData>(
    slot: 'head' | 'cell',
    column: Column<DataTableFeatures, TData>,
    size: () => number,
    section: DataTableSection,
  ) => SlotBinding
  /** Pinned-edge marker for the innermost pinned column on each side. */
  readonly pinnedEdge: <TData extends RowData>(
    column: Column<DataTableFeatures, TData>,
  ) => 'start' | 'end' | undefined
}

export const [DataTableProvider, useDataTableContext] =
  /* @__PURE__ */ createContextProvider<DataTableContextValue>('DataTable')
