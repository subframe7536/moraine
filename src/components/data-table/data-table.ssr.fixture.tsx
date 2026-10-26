import { renderToString } from 'solid-js/web'

import { createDataTable } from './create-data-table'
import { DataTable } from './data-table'
import type { DataTableT } from './data-table.types'

interface RowItem {
  id: string
  title: string
  count: number
}

const FIXTURE_COLUMNS: DataTableT.Column<RowItem>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: (props) => <span>{props.row.getValue('title')}</span>,
  },
  {
    accessorKey: 'count',
    header: 'Count',
    cell: (props) => <span>{props.row.getValue('count')}</span>,
  },
]

const BASE_ROWS: RowItem[] = [{ id: '1', title: 'First Item', count: 10 }]

const EXTRA_ROWS: RowItem[] = [
  { id: '1', title: 'First Item', count: 10 },
  { id: '2', title: 'Second Item', count: 20 },
]

export function DataTableHydrationFixture(props: { extraRow?: boolean }) {
  const table = createDataTable({
    columns: FIXTURE_COLUMNS,
    data: () => (props.extraRow ? EXTRA_ROWS : BASE_ROWS),
    expandable: true,
    initialState: { expanded: { '0': true } },
  })

  return (
    <DataTable
      table={table}
      expandedRowRender={(props) => <div>{props.row.original.title} details</div>}
    />
  )
}

export function renderDataTableFixture(): string {
  return renderToString(() => <DataTableHydrationFixture extraRow={true} />)
}

export function renderSingleRowDataTableFixture(): string {
  return renderToString(() => <DataTableHydrationFixture extraRow={false} />)
}
