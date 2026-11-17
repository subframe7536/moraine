import type { FlowComponent } from 'solid-js'

import { createTablePart } from './table-part'
import type { TableT } from './table.types'

/**
 * Header section of the surrounding `Table`; renders a `thead`. Place a `Table.Row` of
 * `Table.Head` cells inside it, before `Table.Body`.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Invoice</Table.Head>
 *       <Table.Head>Status</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 * </Table>
 * ```
 */
export const TableHeader: FlowComponent<TableT.HeaderProps> = /* @__PURE__ */ createTablePart(
  'header',
  'thead',
)
