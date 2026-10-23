import { createContextProvider } from '../../shared/create-context-provider'

import type { TableT } from './table.types'

interface TableContext {
  readonly size: TableT.Variants['size']
  readonly striped: TableT.Variants['striped']
  readonly borderless: TableT.Variants['borderless']
  readonly slotOverrides: {
    readonly classes?: TableT.Classes
    readonly styles?: TableT.Styles
  }
}

export const [TableProvider, useTableContext] =
  /* @__PURE__ */ createContextProvider<TableContext>('Table')
