import { waitFor } from '@solidjs/testing-library'
import type { SortingState } from '@tanstack/solid-table'
import { createSignal } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../test-util/ssr-test'

import {
  DataTableFeaturesFixture,
  VirtualColumnsDataTableFixture,
  VirtualRowsDataTableFixture,
} from './data-table-features.ssr.fixture'

const FIXTURE = '/src/data-table/data-table-features.ssr.fixture.tsx'

afterEach(() => {
  vi.restoreAllMocks()
})

function bodyRow(container: HTMLElement, text: string): HTMLTableRowElement {
  return [...container.querySelectorAll<HTMLTableRowElement>('tbody tr')].find((row) =>
    row.textContent?.includes(text),
  )!
}

function priorities(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-slot="data-table-sort-index"]')].map(
    (element) => element.textContent ?? '',
  )
}

function summary(container: HTMLElement): string | null | undefined {
  return container.querySelector('[data-slot="data-table-pagination"]')?.firstElementChild
    ?.textContent
}

test('server-renders tree indentation, sort priorities, and the row count', () => {
  const container = document.createElement('div')
  container.innerHTML = renderSsrFixture(FIXTURE, 'renderDataTableFeaturesFixture')

  const child = bodyRow(container, 'components')
  expect(child.style.getPropertyValue('--mo-data-table-depth')).toBe('1')
  expect(child.querySelector('td[data-tree]')?.textContent).toBe('components')
  expect(bodyRow(container, 'button.tsx').style.getPropertyValue('--mo-data-table-depth')).toBe('2')
  expect(bodyRow(container, 'README.md').querySelector('td[data-tree]')).toBeNull()

  expect(priorities(container)).toEqual(['1', '2'])
  const sortButton = container.querySelectorAll<HTMLButtonElement>(
    '[data-slot="data-table-sort-button"]',
  )[1]!
  const name = sortButton
    .getAttribute('aria-labelledby')!
    .split(' ')
    .map((id) => container.querySelector(`[id="${id}"]`)?.textContent)
    .join(' ')
  expect(name).toBe('Kind Sorted ascending Sort priority 1')

  expect(summary(container)).toBe('4 rows')
})

test('hydrates the new table features and keeps them reactive', () => {
  const errorSpy = vi.spyOn(console, 'error')
  const [sorting, setSorting] = createSignal<SortingState>([
    { id: 'kind', desc: false },
    { id: 'size', desc: true },
  ])

  const { container } = hydrateFixture(FIXTURE, 'renderDataTableFeaturesFixture', () => (
    <DataTableFeaturesFixture sorting={sorting()} />
  ))

  const child = bodyRow(container, 'components')
  const treeCell = child.querySelector('td[data-tree]')
  expect(treeCell?.textContent).toBe('components')
  expect(priorities(container)).toEqual(['1', '2'])
  expect(summary(container)).toBe('4 rows')

  // Hydrated nodes stay in place and keep reacting.
  setSorting([{ id: 'size', desc: true }])
  expect(priorities(container)).toEqual([])
  expect(bodyRow(container, 'components').querySelector('td[data-tree]')).toBe(treeCell)

  const checkbox = bodyRow(container, 'README.md').querySelector<HTMLElement>('[role="checkbox"]')!
  checkbox.click()
  expect(summary(container)).toBe('1 of 4 selected')

  expect(errorSpy).not.toHaveBeenCalled()
})

test('hydrates an empty virtual shell, then renders windowed columns', async () => {
  const errorSpy = vi.spyOn(console, 'error')
  const markup = renderSsrFixture(FIXTURE, 'renderVirtualColumnsDataTableFixture')
  // The server cannot measure the viewport, so it sends the header and an empty body shell.
  expect(markup).not.toContain('<colgroup')
  expect(markup).not.toContain('data-index=')

  const { container } = hydrateFixture(FIXTURE, 'renderVirtualColumnsDataTableFixture', () => (
    <VirtualColumnsDataTableFixture />
  ))
  const table = container.querySelector('table')!
  const thead = table.tHead
  const tbody = table.tBodies[0]

  await waitFor(() =>
    expect(
      [...table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-index]')].map(
        (row) => row.dataset.index,
      ),
    ).toEqual(['0', '1', '2']),
  )
  expect(table.tHead).toBe(thead)
  expect(table.tBodies[0]).toBe(tbody)

  // 360px viewport minus the 60px pin shows columns 0-2 of 12; the rest become one placeholder.
  const row = table.querySelector<HTMLTableRowElement>('tbody tr[data-index="0"]')!
  expect(
    [...row.cells].map((cell) =>
      cell.dataset.slot === 'data-table-cell-spacer' ? `<${cell.colSpan}>` : cell.textContent,
    ),
  ).toEqual(['r0', 'r0c0', 'r0c1', 'r0c2', '<9>'])
  expect(table.querySelectorAll('thead th').length).toBe(13)
  expect(table.querySelectorAll('colgroup col').length).toBe(13)
  expect(table.getAttribute('aria-colcount')).toBe('13')
  expect(table.style.tableLayout).toBe('fixed')

  expect(errorSpy).not.toHaveBeenCalled()
})

test('hydrates a rows-only virtual table without a colgroup', async () => {
  const errorSpy = vi.spyOn(console, 'error')
  const { container } = hydrateFixture(FIXTURE, 'renderVirtualRowsDataTableFixture', () => (
    <VirtualRowsDataTableFixture />
  ))
  const table = container.querySelector('table')!

  await waitFor(() =>
    expect(
      [...table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-index]')].map(
        (row) => row.dataset.index,
      ),
    ).toEqual(['0', '1', '2']),
  )
  const row = table.querySelector<HTMLTableRowElement>('tbody tr[data-index="0"]')!
  expect(row.cells.length).toBe(13)
  expect(row.querySelector('[aria-colindex]')).toBeNull()
  expect(table.querySelector('colgroup')).toBeNull()
  expect(table.hasAttribute('aria-colcount')).toBe(false)
  expect(errorSpy).not.toHaveBeenCalled()
})
