import type { SlotOverrides } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'

import type { TableT } from './table.types'

interface TableContext {
  /** Resolved root variants, forwarded to every part. */
  readonly variants: TableT.Variants
  readonly slotOverrides: SlotOverrides<Extract<keyof TableT.Slot, string>>
}

export const [TableProvider, useTableContext] =
  /* @__PURE__ */ createContextProvider<TableContext>('Table')
