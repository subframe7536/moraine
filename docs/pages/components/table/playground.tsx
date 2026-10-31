import { Badge, Table } from '@src'
import { For } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ROWS = [
  { invoice: 'INV-001', status: 'Paid', tone: 'success', method: 'Credit Card', amount: '$250.00' },
  { invoice: 'INV-002', status: 'Pending', tone: 'warning', method: 'PayPal', amount: '$150.00' },
  {
    invoice: 'INV-003',
    status: 'Unpaid',
    tone: 'danger',
    method: 'Bank Transfer',
    amount: '$350.00',
  },
  { invoice: 'INV-004', status: 'Paid', tone: 'success', method: 'Credit Card', amount: '$450.00' },
  { invoice: 'INV-005', status: 'Paid', tone: 'success', method: 'PayPal', amount: '$550.00' },
  {
    invoice: 'INV-006',
    status: 'Pending',
    tone: 'warning',
    method: 'Bank Transfer',
    amount: '$200.00',
  },
] as const

export default function TablePlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'striped', label: 'Striped', defaultValue: false },
        { kind: 'switch', prop: 'hoverEffect', label: 'Hover Effect', defaultValue: false },
        {
          kind: 'select',
          prop: 'showBorder',
          label: 'Show Border',
          defaultValue: 'row',
          options: [
            { label: 'Row', value: 'row' },
            { label: 'Column', value: 'col' },
            { label: 'Both', value: 'both' },
          ],
        },
      ]}
    >
      {(props) => (
        <Table
          size={props.size}
          striped={props.striped}
          hoverEffect={props.hoverEffect}
          showBorder={props.showBorder}
        >
          <Table.Caption>A list of recent transactions.</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head>Invoice</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Method</Table.Head>
              <Table.Head align="right">Amount</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <For each={ROWS}>
              {(row) => (
                <Table.Row>
                  <Table.Cell>
                    <span class="font-medium">{row.invoice}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={row.tone} variant="subtle">
                      {row.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{row.method}</Table.Cell>
                  <Table.Cell align="right">{row.amount}</Table.Cell>
                </Table.Row>
              )}
            </For>
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Cell colSpan={3}>Total</Table.Cell>
              <Table.Cell align="right">
                <span class="font-semibold">$1,950.00</span>
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>
      )}
    </DocsPlayground>
  )
}
