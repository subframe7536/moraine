import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'

import { TableBody } from './table-body'
import { TableCaption } from './table-caption'
import { TableCell } from './table-cell'
import { TableProvider } from './table-context'
import { TableFooter } from './table-footer'
import { TableHead } from './table-head'
import { TableHeader } from './table-header'
import { TableRow } from './table-row'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

/**
 * Styled native table for data you lay out yourself, such as invoices or comparison grids with a
 * known set of columns. Compose `Table.Caption`, `Table.Header`, `Table.Body`, `Table.Footer`,
 * `Table.Row`, `Table.Head`, and `Table.Cell` in table order. Use `DataTable` from
 * `moraine/data-table` when you need sorting, selection, pagination, or server data, and `List`
 * for a one-column collection. The `table` sits in a horizontally scrolling container element.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table striped>
 *   <Table.Caption>Recent invoices</Table.Caption>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Invoice</Table.Head>
 *       <Table.Head>Status</Table.Head>
 *       <Table.Head align="end">Amount</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>INV-001</Table.Cell>
 *       <Table.Cell>Paid</Table.Cell>
 *       <Table.Cell align="end">$250.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
export function Table(props: TableT.Props): JSX.Element {
  const [local, rest] = splitProps(props, [
    'size',
    'striped',
    'highlightOnHover',
    'border',
    'containerRef',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
    'children',
  ])
  const {
    slots: { container: containerSlot, root: rootSlot },
    variants,
  } = useRecipe(tableRecipe, local)

  return (
    <TableProvider value={{ variants, slotOverrides: pickSlotOverrides(local) }}>
      <div ref={local.containerRef} data-slot="table-container" {...containerSlot}>
        <table data-slot="table" {...rootSlot} {...rest} ref={local.ref}>
          {local.children}
        </table>
      </div>
    </TableProvider>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Footer = TableFooter
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Caption = TableCaption
