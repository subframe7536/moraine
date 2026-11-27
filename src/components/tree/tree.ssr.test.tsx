import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { createTree } from './tree'
import { TreeHydrationFixture } from './tree.ssr.fixture'
const FIXTURE = '/src/components/tree/tree.ssr.fixture.tsx'

function labels(container: HTMLElement): Array<string> {
  return Array.from(container.querySelectorAll('[role="treeitem"]')).map(
    (element) => element.getAttribute('aria-label') ?? '',
  )
}

it('hydrates expanded nested items and keeps the server DOM', () => {
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

it('hydrates keyboard interaction on server-rendered items', () => {
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

it('hydrates the default checkbox in each row when checkable', () => {
  const { container } = hydrateFixture(FIXTURE, 'renderCheckableTreeFixture', () => (
    <TreeHydrationFixture checkable />
  ))
  expect(container.querySelectorAll('[data-slot="tree-checkbox"]')).toHaveLength(5)

  fireEvent.click(container.querySelector('[aria-label="src"] [data-slot="tree-checkbox"]')!)
  expect(container.querySelector('[aria-label="index.ts"]')?.getAttribute('aria-checked')).toBe(
    'true',
  )
})

it('reads JSX children getters once in ItemLabel and ItemTrigger', () => {
  let labelReads = 0
  let triggerReads = 0

  const view = render(() => {
    const tree = createTree<string>({
      items: () => ['Docs'],
      getKey: (name) => name,
    })

    return (
      <tree.Tree
        aria-label="Folders"
        itemRender={(item) => (
          <tree.Item item={item}>
            {createComponent(tree.ItemTrigger, {
              get children() {
                triggerReads += 1
                return <span>&gt;</span>
              },
            })}
            {createComponent(tree.ItemLabel, {
              get children() {
                labelReads += 1
                return <span>{item.label}</span>
              },
            })}
          </tree.Item>
        )}
      />
    )
  })

  expect(triggerReads).toBe(1)
  expect(labelReads).toBe(1)
  view.unmount()
})
