import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

/**
 * Visible title of the surrounding `Table`; renders a `caption` that names the table for
 * assistive technology. Place it first inside `Table`. When a visible caption does not fit, set
 * `aria-label` on `Table` instead.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Caption>Recent invoices</Table.Caption>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>INV-001</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
export const TableCaption: FlowComponent<TableT.CaptionProps> = /* @__PURE__ */ createTablePart(
  'caption',
  'caption',
)
