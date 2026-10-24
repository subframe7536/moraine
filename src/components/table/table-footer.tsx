import type { Component } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableFooter: Component<TableT.FooterProps> = /* @__PURE__ */ createTablePart(
  'footer',
  'tfoot',
)
