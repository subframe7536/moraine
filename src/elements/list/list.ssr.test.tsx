import { waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { ListHydrationFixture, VirtualListHydrationFixture } from './list.ssr.fixture.tsx'

test('hydrates keyed list items and moves the same rows on reorder', () => {
  const [items, setItems] = createSignal(['Alpha', 'Beta'])
  const { container } = hydrateFixture(
    '/src/elements/list/list.ssr.fixture.tsx',
    'renderListFixture',
    () => <ListHydrationFixture items={items()} />,
  )
  const root = container.querySelector('[role="list"]')!
  const rows = Array.from(root.children)
  setItems(['Beta', 'Alpha', 'Gamma'])
  expect(root.children[0]).toBe(rows[1])
  expect(root.children[1]).toBe(rows[0])
  expect(root.children[1]?.textContent).toBe('1: Alpha')
  setItems([])
  expect(root.children).toHaveLength(0)
  expect(container.querySelector('[role="list"]')).toBe(root)
})

test('hydrates an empty virtual shell before attaching measured client rows', async () => {
  const { container } = hydrateFixture(
    '/src/elements/list/list.ssr.fixture.tsx',
    'renderVirtualListFixture',
    () => <VirtualListHydrationFixture />,
  )
  const root = container.querySelector('[role="list"]')!
  const shell = root.firstElementChild
  expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(0)
  await waitFor(() => expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2))
  expect(root.firstElementChild).toBe(shell)
  expect(root.textContent).toBe('AlphaBeta')
})
