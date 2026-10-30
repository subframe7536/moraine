import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableBody: FlowComponent<TableT.BodyProps> = /* @__PURE__ */ createTablePart(
  'body',
  'tbody',
)
