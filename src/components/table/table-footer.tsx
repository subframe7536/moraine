import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableFooter: FlowComponent<TableT.FooterProps> = /* @__PURE__ */ createTablePart(
  'footer',
  'tfoot',
)
