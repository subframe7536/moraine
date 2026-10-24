import type { Component } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableBody: Component<TableT.BodyProps> = /* @__PURE__ */ createTablePart(
  'body',
  'tbody',
)
