import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useTablePart } from './table-part'
import { TABLE_TEXT_ALIGN_CLASS } from './table.recipe'
import type { TableT } from './table.types'

export function TableCell(props: TableT.CellProps): JSX.Element {
  const [local, rest] = splitProps(props, ['align', 'truncated', 'class', 'style'])
  const { cell: cellSlot } = useTablePart('cell', local, {
    own: () => ({
      class: [TABLE_TEXT_ALIGN_CLASS[local.align ?? 'left'], local.truncated && 'truncate'],
    }),
  })

  return <td data-slot="table-cell" {...cellSlot} {...rest} />
}
