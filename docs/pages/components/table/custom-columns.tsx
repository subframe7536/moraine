import { Table } from '@src'

export function CustomColumns() {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head class="max-w-[120px] truncate">
            Very very very very very very very very Long Column Title
          </Table.Head>
          <Table.Head align="center">Centered</Table.Head>
          <Table.Head align="right">Right Aligned</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell class="max-w-[120px] truncate">
            This is a very long cell content that will be truncated
          </Table.Cell>
          <Table.Cell align="center">Middle</Table.Cell>
          <Table.Cell align="right">$99.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}
