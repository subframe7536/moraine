import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useTablePart } from './table-part'
import { TABLE_TEXT_ALIGN_CLASS } from './table.recipe'
import type { TableT } from './table.types'

/**
 * Column or row header cell of the surrounding `Table`; renders a `th`. Place it in a
 * `Table.Row` inside `Table.Header`, or use `scope="row"` in a body row to label that row. Text
 * is start-aligned by default (not browser-centered); use `align="end"` for numeric columns.
 *
 * @example
 * ```tsx
 * import { Table } from 'moraine'
 *
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Invoice</Table.Head>
 *       <Table.Head align="end">Amount</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 * </Table>
 * ```
 */
export function TableHead(props: TableT.HeadProps): JSX.Element {
  const [local, rest] = splitProps(props, ['align', 'class', 'style'])
  // Always set the alignment: a `th` outside `thead` would otherwise fall back to the
  // browser's centered default.
  const { head: headSlot } = useTablePart('head', local, {
    own: () => ({
      class: TABLE_TEXT_ALIGN_CLASS[local.align ?? 'start'],
    }),
  })

  return <th data-slot="table-head" {...headSlot} {...rest} />
}
