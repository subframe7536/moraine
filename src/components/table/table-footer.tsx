import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableFooter: <T extends ValidComponent = 'tfoot'>(
  props: TableT.FooterProps<T>,
) => JSX.Element = /* @__PURE__ */ createTablePart('footer', 'tfoot')
