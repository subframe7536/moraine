import { Table } from '@src'

export function CustomColumns() {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>
            <div class="max-w-[120px] truncate">Very Long Column Title</div>
          </Table.Head>
          <Table.Head align="center">Centered</Table.Head>
          <Table.Head align="right">Right Aligned</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>
            <div class="max-w-[120px] truncate">
              This is a very long cell content that will be truncated
            </div>
          </Table.Cell>
          <Table.Cell align="center">Middle</Table.Cell>
          <Table.Cell align="right">$99.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}
