import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableHeader: FlowComponent<TableT.HeaderProps> = /* @__PURE__ */ createTablePart(
  'header',
  'thead',
)
