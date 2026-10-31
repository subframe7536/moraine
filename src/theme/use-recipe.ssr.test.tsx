import { expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../test-util/ssr-test'

import { UseRecipeSsrFixture } from './use-recipe.ssr.fixture'

function parse(markup: string) {
  const container = document.createElement('div')
  container.innerHTML = markup
  const root = container.querySelector('div')!
  return {
    root,
    label: root.querySelector('span')!,
    reads: JSON.parse(root.dataset.reads!) as string[],
    styles: JSON.parse(root.dataset.styles!) as Record<string, unknown>[],
  }
}

test('server bindings apply every layer and agree across repeated reads', () => {
  const { root, label, reads, styles } = parse(
    renderSsrFixture('/src/theme/use-recipe.ssr.fixture.tsx', 'renderUseRecipeFixture'),
  )
  expect(root.dataset.size).toBe('sm')
  expect(root.className.trim()).toBe('base-root size-sm user-root')
  expect(label.className.trim()).toBe('base-label ctx-label enforced-label')
  expect(reads).toEqual([
    root.className.trim(),
    root.className.trim(),
    label.className.trim(),
    label.className.trim(),
  ])
  expect(styles[0]).toEqual({ '--gap': '2px', '--own': 1 })
  expect(styles[1]).toEqual(styles[0])
  expect(styles[2]).toEqual({ color: 'red' })
  expect(root.style.getPropertyValue('--gap')).toBe('2px')
  expect(label.style.color).toBe('red')
})

test('server bindings resolve Theme layers and defaults', () => {
  const { root, label } = parse(
    renderSsrFixture('/src/theme/use-recipe.ssr.fixture.tsx', 'renderUseRecipeThemedFixture'),
  )
  expect(root.dataset.size).toBe('lg')
  expect(root.className.trim()).toBe('base-root size-lg user-root')
  expect(label.className.trim()).toBe('base-label label-lg themed-label ctx-label enforced-label')
  expect(root.style.getPropertyValue('--gap')).toBe('1px')
})

test('hydrates server bindings without replacing nodes', () => {
  const { container } = hydrateFixture(
    '/src/theme/use-recipe.ssr.fixture.tsx',
    'renderUseRecipeFixture',
    () => <UseRecipeSsrFixture />,
  )
  const root = container.querySelector('div')!
  expect(root.className.trim()).toBe('base-root size-sm user-root')
  expect(container.querySelector('span')!.className.trim()).toBe(
    'base-label ctx-label enforced-label',
  )
})

test('server bindings carry data attributes and omit an empty class or style', () => {
  const markup = renderSsrFixture(
    '/src/theme/use-recipe.ssr.fixture.tsx',
    'renderUseRecipeDataFixture',
  )
  expect(markup).not.toMatch(/\sstyle(=|\s|>)/u)
  expect(markup).not.toMatch(/<div[^>]*\sclass=/u)
  const container = document.createElement('div')
  container.innerHTML = markup
  const root = container.querySelector('div')!
  const label = root.querySelector('span')!
  expect(root.getAttribute('data-expanded')).toBe('')
  expect(root.hasAttribute('data-disabled')).toBe(false)
  expect(label.className.trim()).toBe('base-label')
  expect(label.getAttribute('data-disabled')).toBe('')
  expect(label.hasAttribute('data-expanded')).toBe(false)
})
