import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Table } from './table'

export function TableHydrationFixture(props: { title?: string; extraRow?: boolean }) {
  return (
    <Table>
      <Table.Caption>Caption</Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.Head>{props.title ?? 'Header'}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Row 1</Table.Cell>
        </Table.Row>
        <Show when={props.extraRow ?? true}>
          <Table.Row>
            <Table.Cell>Row 2</Table.Cell>
          </Table.Row>
        </Show>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell>Footer</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  )
}

export function renderTableFixture(): string {
  return renderToString(() => <TableHydrationFixture />)
}

export function renderSingleRowTableFixture(): string {
  return renderToString(() => <TableHydrationFixture extraRow={false} />)
}
