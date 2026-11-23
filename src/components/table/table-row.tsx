import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { pick } from '../../shared/utils'

import { useTablePart } from './table-part'
import { tableDataAttributes } from './table.recipe'
import type { TableT } from './table.types'
/**
 * Row of the surrounding `Table`; renders a `tr`. Place it inside `Table.Header`, `Table.Body`,
 * or `Table.Footer`, holding `Table.Head` or `Table.Cell` children. `selected` only changes the
 * row's appearance (`data-selected`) and sets no `aria-selected`, so put a labelled control such
 * as a checkbox in the row to expose the state to assistive technology.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Body>
 *     <Table.Row selected>
 *       <Table.Cell>INV-001</Table.Cell>
 *       <Table.Cell>Paid</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
export function TableRow(props: TableT.RowProps): JSX.Element {
  const local = pick(props, 'selected', 'class', 'style')
  const rest = omit(props, 'selected', 'class', 'style')
  const { row: rowSlot } = useTablePart('row', local, {
    data: tableDataAttributes.row({ selected: () => local.selected }),
  })

  // Selection is presentation only: `aria-selected` is not valid on rows of a static table.
  return <tr data-slot="table-row" {...rowSlot} {...rest} />
}
