import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { TableHydrationFixture } from './table.ssr.fixture'

test.each([true, false])(
  'hydrates compound table parts and updates conditional rows (initially present=%s)',
  (initialExtraRow) => {
    const [title, setTitle] = createSignal('Header')
    const [extraRow, setExtraRow] = createSignal(initialExtraRow)
    const { container } = hydrateFixture(
      '/src/components/table/table.ssr.fixture.tsx',
      initialExtraRow ? 'renderTableFixture' : 'renderSingleRowTableFixture',
      () => <TableHydrationFixture title={title()} extraRow={extraRow()} />,
    )
    const root = container.firstElementChild
    const head = container.querySelector('[data-slot="table-head"]')!
    const rows = () =>
      container.querySelectorAll('[data-slot="table-body"] [data-slot="table-row"]')

    expect(rows().length).toBe(initialExtraRow ? 2 : 1)
    expect(head.textContent).toBe('Header')

    setTitle('Updated Header')
    setExtraRow(!initialExtraRow)

    expect(container.firstElementChild).toBe(root)
    expect(head.textContent).toBe('Updated Header')
    expect(rows().length).toBe(!initialExtraRow ? 2 : 1)
  },
)
