import { describe, expect, it } from 'vitest'

import { List } from '../components/list'
import { hydrateFixture } from '../test-util/ssr-test'

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

describe('sortable SSR Hydration', () => {
  it('hydrates sortable list items without shifting hydration keys', () => {
    const { container } = hydrateFixture(
      '/src/dnd/sortable.ssr.fixture.tsx',
      'renderSortableListFixture',
      () => {
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
      },
    )

    const hydratedRows = Array.from(container.querySelectorAll('[data-row-id]'))
    expect(hydratedRows).toHaveLength(3)
    expect(hydratedRows.map((el) => el.textContent)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
