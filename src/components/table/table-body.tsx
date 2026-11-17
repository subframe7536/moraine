import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

/**
 * Body section of the surrounding `Table`; renders a `tbody`. Place `Table.Row` elements with
 * `Table.Cell` children inside it, after `Table.Header`. Native `tbody` attributes are forwarded.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>INV-001</Table.Cell>
 *       <Table.Cell>Paid</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
export const TableBody: FlowComponent<TableT.BodyProps> = /* @__PURE__ */ createTablePart(
  'body',
  'tbody',
)
