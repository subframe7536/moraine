import { fireEvent } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { TreeHydrationFixture } from './tree.ssr.fixture'

const FIXTURE = '/src/components/tree/tree.ssr.fixture.tsx'

function labels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[role="treeitem"]')).map(
    (element) => element.getAttribute('aria-label') ?? '',
  )
}

test('hydrates expanded nested items and keeps the server DOM', () => {
  const { container } = hydrateFixture(FIXTURE, 'renderTreeFixture', () => <TreeHydrationFixture />)
  const tree = container.querySelector('[role="tree"]')!
  const src = container.querySelector('[aria-label="src"]')!

  expect(labels(container)).toEqual(['src', 'index.ts', 'tree.tsx', 'docs', 'README.md'])
  expect(src.getAttribute('aria-expanded')).toBe('true')
  expect(container.querySelector('[aria-label="README.md"]')?.getAttribute('aria-selected')).toBe(
    'true',
  )
  const guide = container.querySelector('[aria-label="index.ts"] [data-slot="tree-guide"]')
  expect(guide).not.toBeNull()
  expect(container.querySelectorAll('[data-slot="tree-guide"]')).toHaveLength(2)

  fireEvent.click(container.querySelector('[aria-label="docs"] [data-slot="tree-trigger"]')!)
  expect(container.querySelector('[aria-label="docs"]')?.getAttribute('aria-expanded')).toBe('true')
  expect(labels(container)).toContain('guide.md')
  expect(container.querySelector('[role="tree"]')).toBe(tree)
  expect(container.querySelector('[aria-label="src"]')).toBe(src)
  expect(container.querySelector('[aria-label="index.ts"] [data-slot="tree-guide"]')).toBe(guide)
})

test('hydrates keyboard interaction on server-rendered items', () => {
  const { container } = hydrateFixture(FIXTURE, 'renderTreeFixture', () => <TreeHydrationFixture />)
  const src = container.querySelector<HTMLElement>('[aria-label="src"]')!
  src.focus()

  fireEvent.keyDown(src, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(container.querySelector('[aria-label="index.ts"]'))

  fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
  expect(document.activeElement).toBe(src)
  fireEvent.keyDown(src, { key: 'ArrowLeft' })
  expect(src.getAttribute('aria-expanded')).toBe('false')
})

test('hydrates the default checkbox in each row when checkable', () => {
  const { container } = hydrateFixture(FIXTURE, 'renderCheckableTreeFixture', () => (
    <TreeHydrationFixture checkable />
  ))
  expect(container.querySelectorAll('[data-slot="tree-checkbox"]')).toHaveLength(5)

  fireEvent.click(container.querySelector('[aria-label="src"] [data-slot="tree-checkbox"]')!)
  expect(container.querySelector('[aria-label="index.ts"]')?.getAttribute('aria-checked')).toBe(
    'true',
  )
})
