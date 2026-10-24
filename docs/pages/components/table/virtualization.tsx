import { Table } from '@src'
import { createTableVirtualizer } from '@src/virtualizer'
import { Dynamic } from 'solid-js/web'

const ROWS = Array.from({ length: 10_000 }, (_, index) => ({
  id: index + 1,
  invoice: `INV-${String(index + 1).padStart(5, '0')}`,
  method: ['Credit Card', 'PayPal', 'Bank Transfer'][index % 3]!,
  status: ['Paid', 'Pending', 'Unpaid'][index % 3]!,
  amount: ((index % 17) + 1) * 25,
}))

type Row = (typeof ROWS)[number]

export function Virtualization() {
  const virtualizer = createTableVirtualizer<Row>({
    estimateSize: () => 41,
    getItemKey: (row) => row.id,
    overscan: 8,
  })

  return (
    <Table
      classes={{
        root: 'block',
        header: 'table w-full table-fixed',
        body: 'block max-h-96 overflow-y-auto [&_tr]:table [&_tr]:w-full [&_tr]:table-fixed',
      }}
    >
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-1/4">Invoice</Table.Head>
          <Table.Head class="w-1/4">Status</Table.Head>
          <Table.Head class="w-1/4">Method</Table.Head>
          <Table.Head class="w-1/4" align="right">
            Amount
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Dynamic
          component={virtualizer.virtualRender}
          entries={ROWS}
          render={(row, _index, props) => (
            <Table.Row {...props}>
              <Table.Cell class="font-medium w-1/4">{row.invoice}</Table.Cell>
              <Table.Cell class="w-1/4">{row.status}</Table.Cell>
              <Table.Cell class="w-1/4">{row.method}</Table.Cell>
              <Table.Cell class="w-1/4" align="right">
                ${row.amount}.00
              </Table.Cell>
            </Table.Row>
          )}
        />
      </Table.Body>
    </Table>
  )
}
