/* oxlint-disable subf/solid-reactivity -- Tests assert lazy memo recomputation outside tracked scopes. */
import { render } from '@solidjs/testing-library'
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
} from '@tanstack/table-core'
import type { ColumnDef, SortingState } from '@tanstack/table-core'
import { createMemo, createRoot, createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { FlexRender } from './flex-render'
import { createTable } from './solid-table'

interface TestRow {
  a: string
  b: string
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
})

const columns: ColumnDef<typeof features, TestRow>[] = [
  { accessorKey: 'a', header: 'A' },
  { accessorKey: 'b', header: 'B' },
]

const data: TestRow[] = [
  { a: '2', b: 'x' },
  { a: '1', b: 'y' },
]

describe('createTable', () => {
  it('setOptions updates tracked row reads', () => {
    createRoot((dispose) => {
      const table = createTable({ features, columns, data })
      const rowCount = createMemo(() => table.getRowModel().rows.length)

      expect(rowCount()).toBe(2)
      table.setOptions((prev) => ({ ...prev, data: [...data, { a: '3', b: 'z' }] }))
      expect(rowCount()).toBe(3)

      dispose()
    })
  })

  it('controlled state from a getter that rebuilds the state object', () => {
    createRoot((dispose) => {
      const [sorting, setSorting] = createSignal<SortingState>([])
      const table = createTable({
        features,
        columns,
        data,
        get state() {
          return { sorting: sorting() }
        },
        onSortingChange: () => {},
      })
      const firstA = createMemo(() => table.getRowModel().rows[0]?.getValue('a'))

      expect(firstA()).toBe('2')
      setSorting([{ id: 'a', desc: false }])
      expect(firstA()).toBe('1')

      dispose()
    })
  })

  it('FlexRender re-renders when its header changes', () => {
    // `render` creates its own root; nesting it inside `createRoot` stalls updates.
    const [headers, dispose] = createRoot((d) => {
      const table = createTable({ features, columns, data })
      return [table.getHeaderGroups()[0]!.headers, d] as const
    })
    const [index, setIndex] = createSignal(0)
    const { container } = render(() => <FlexRender header={headers[index()]!} />)

    expect(container.textContent).toBe('A')
    setIndex(1)
    expect(container.textContent).toBe('B')

    dispose()
  })

  it('FlexRender suppresses placeholder headers and footers', () => {
    interface NestedRow {
      a: string
      b: string
      c: string
    }
    const groupColumns: ColumnDef<typeof features, NestedRow>[] = [
      {
        header: 'Group',
        columns: [
          { accessorKey: 'a', header: 'A', footer: 'Foot A' },
          { accessorKey: 'b', header: 'B', footer: 'Foot B' },
        ],
      },
      { accessorKey: 'c', header: 'C', footer: 'Foot C' },
    ]
    const [table, dispose] = createRoot((d) => {
      const t = createTable({
        features,
        columns: groupColumns,
        data: [{ a: '1', b: '2', c: '3' }],
      })
      return [t, d] as const
    })

    const headerGroups = table.getHeaderGroups()
    const groupRow = headerGroups[0]!
    const placeholderHeader = groupRow.headers.find((h) => h.isPlaceholder)!
    const realHeader = groupRow.headers.find((h) => !h.isPlaceholder)!

    expect(placeholderHeader).toBeDefined()
    expect(placeholderHeader.isPlaceholder).toBe(true)

    const { container: placeholderHeaderContainer } = render(() => (
      <FlexRender header={placeholderHeader} />
    ))
    expect(placeholderHeaderContainer.textContent).toBe('')

    const { container: realHeaderContainer } = render(() => <FlexRender header={realHeader} />)
    expect(realHeaderContainer.textContent).toBe('Group')

    const footerGroups = table.getFooterGroups()
    const footerHeaders = footerGroups.flatMap((g) => g.headers)
    const placeholderFooter = footerHeaders.find((h) => h.isPlaceholder)
    const realFooter = footerHeaders.find((h) => !h.isPlaceholder && h.column.columnDef.footer)

    if (placeholderFooter) {
      const { container: placeholderFooterContainer } = render(() => (
        <FlexRender footer={placeholderFooter} />
      ))
      expect(placeholderFooterContainer.textContent).toBe('')
    }
    if (realFooter) {
      const { container: realFooterContainer } = render(() => <FlexRender footer={realFooter} />)
      expect(realFooterContainer.textContent).not.toBe('')
    }

    dispose()
  })
})
