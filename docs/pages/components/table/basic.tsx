import { Badge, Table } from '@src'

export function Basic() {
  return (
    <Table>
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
        <Table.Row>
          <Table.Cell class="font-medium">INV-001</Table.Cell>
          <Table.Cell>
            <Badge tone="success" variant="subtle">
              Paid
            </Badge>
          </Table.Cell>
          <Table.Cell>Credit Card</Table.Cell>
          <Table.Cell align="right">$250.00</Table.Cell>
        </Table.Row>
        <Table.Row selected>
          <Table.Cell class="font-medium">INV-002</Table.Cell>
          <Table.Cell>
            <Badge tone="warning" variant="subtle">
              Pending
            </Badge>
          </Table.Cell>
          <Table.Cell>PayPal</Table.Cell>
          <Table.Cell align="right">$150.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell class="font-medium">INV-003</Table.Cell>
          <Table.Cell>
            <Badge tone="danger" variant="subtle">
              Unpaid
            </Badge>
          </Table.Cell>
          <Table.Cell>Bank Transfer</Table.Cell>
          <Table.Cell align="right">$350.00</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell colSpan={3}>Total</Table.Cell>
          <Table.Cell align="right" class="font-semibold">
            $750.00
          </Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  )
}
