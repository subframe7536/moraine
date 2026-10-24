import type { Component } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableHeader: Component<TableT.HeaderProps> = /* @__PURE__ */ createTablePart(
  'header',
  'thead',
)
