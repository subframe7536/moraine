import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useTablePart } from './table-part'
import { tableDataAttributes } from './table.recipe'
import type { TableT } from './table.types'

export function TableRow(props: TableT.RowProps): JSX.Element {
  const [local, rest] = splitProps(props, ['selected', 'class', 'style'])
  const { row: rowSlot } = useTablePart('row', local, {
    data: tableDataAttributes.row({ selected: () => local.selected }),
  })

  // Selection is presentation only: `aria-selected` is not valid on rows of a static table.
  return <tr data-slot="table-row" {...rowSlot} {...rest} />
}
