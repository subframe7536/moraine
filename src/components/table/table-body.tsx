import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableBody: <T extends ValidComponent = 'tbody'>(
  props: TableT.BodyProps<T>,
) => JSX.Element = /* @__PURE__ */ createTablePart('body', 'tbody')
