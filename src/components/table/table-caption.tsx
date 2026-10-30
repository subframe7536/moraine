import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableCaption: FlowComponent<TableT.CaptionProps> = /* @__PURE__ */ createTablePart(
  'caption',
  'caption',
)
