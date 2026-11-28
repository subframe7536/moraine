import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'
/**
 * Footer section of the surrounding `Table`; renders a `tfoot`, typically holding a totals row.
 * Place `Table.Row` elements with `Table.Cell` children inside it, after `Table.Body`.
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
 *   <Table.Footer>
 *     <Table.Row>
 *       <Table.Cell>Total</Table.Cell>
 *       <Table.Cell align="end">$250.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Footer>
 * </Table>
 * ```
 */
export const TableFooter: FlowComponent<TableT.FooterProps> = /* @__PURE__ */ createTablePart(
  'footer',
  'tfoot',
)
