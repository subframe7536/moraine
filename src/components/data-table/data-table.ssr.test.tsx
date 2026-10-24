import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { DataTableHydrationFixture } from './data-table.ssr.fixture'

test.each([true, false])(
  'hydrates data table and updates rows reactively (initially present=%s)',
  (initialExtraRow) => {
    const [extraRow, setExtraRow] = createSignal(initialExtraRow)

    const { container } = hydrateFixture(
      '/src/components/data-table/data-table.ssr.fixture.tsx',
      initialExtraRow ? 'renderDataTableFixture' : 'renderSingleRowDataTableFixture',
      () => <DataTableHydrationFixture extraRow={extraRow()} />,
    )

    const root = container.firstElementChild
    const rows = () =>
      container.querySelectorAll('[data-slot="data-table-body"] [data-slot="data-table-row"]')

    expect(rows().length).toBe(initialExtraRow ? 2 : 1)

    setExtraRow(!initialExtraRow)

    expect(container.firstElementChild).toBe(root)
    expect(rows().length).toBe(!initialExtraRow ? 2 : 1)
  },
)
