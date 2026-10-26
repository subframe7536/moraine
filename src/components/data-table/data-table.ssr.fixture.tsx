import { createTable } from '@tanstack/solid-table'
import type { ColumnDef } from '@tanstack/solid-table'
import { renderToString } from 'solid-js/web'

import { DataTable } from './data-table'
import { getDefaultDataTableFeatures } from './data-table-helpers'

interface RowItem {
  id: string
  title: string
  count: number
}

const FIXTURE_COLUMNS: ColumnDef<any, RowItem>[] = [
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
  const table = createTable({
    features: getDefaultDataTableFeatures({ pagination: false }),
    columns: FIXTURE_COLUMNS,
    get data() {
      return props.extraRow ? EXTRA_ROWS : BASE_ROWS
    },
  })

  return <DataTable table={table} />
}

export function renderDataTableFixture(): string {
  return renderToString(() => <DataTableHydrationFixture extraRow={true} />)
}

export function renderSingleRowDataTableFixture(): string {
  return renderToString(() => <DataTableHydrationFixture extraRow={false} />)
}
