import { renderToString } from '@solidjs/web'

import { List } from '../components/list'

import { createListSortable } from './create-list-sortable'

interface Row {
  id: string
  label: string
}

const ITEMS: Array<Row> = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
]

export function renderSortableListFixture(): string {
  return renderToString(() => {
    const sortable = createListSortable({
      items: () => ITEMS,
      getItemKey: (item) => item.id,
      onReorder: () => {},
    })
    return (
      <sortable.Provider>
        <List
          items={ITEMS}
          itemRender={(rowProps) => {
            const row = sortable.useRow(rowProps)
            return (
              <li {...row.props} data-row-id={rowProps.item.id}>
                <span>{rowProps.item.label}</span>
              </li>
            )
          }}
        />
      </sortable.Provider>
    )
  })
}
