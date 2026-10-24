import type { Component } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableCaption: Component<TableT.CaptionProps> = /* @__PURE__ */ createTablePart(
  'caption',
  'caption',
)
