import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

export const TableCaption: <T extends ValidComponent = 'caption'>(
  props: TableT.CaptionProps<T>,
) => JSX.Element = /* @__PURE__ */ createTablePart('caption', 'caption')
