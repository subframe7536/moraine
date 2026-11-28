import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useTablePart } from './table-part'
import { TABLE_TEXT_ALIGN_CLASS } from './table.recipe'
import type { TableT } from './table.types'
/**
 * Data cell of the surrounding `Table`; renders a `td`. Place it in a `Table.Row` inside
 * `Table.Body` or `Table.Footer`. Text is start-aligned by default; use `align="end"` for numeric
 * columns, and native `colSpan` or `rowSpan` to span cells.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>INV-001</Table.Cell>
 *       <Table.Cell align="end">$250.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
export function TableCell(props: TableT.CellProps): JSX.Element {
  const rest = omit(props, 'align', 'class', 'style')
  const { cell: cellSlot } = useTablePart('cell', props, {
    own: () => ({
      class: TABLE_TEXT_ALIGN_CLASS[props.align ?? 'start'],
    }),
  })

  return <td data-slot="table-cell" {...cellSlot} {...rest} />
}
