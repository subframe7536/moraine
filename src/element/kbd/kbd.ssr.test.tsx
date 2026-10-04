import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import type { KbdGroupT } from '../kbd-group/kbd-group.types'

import { KbdHydrationFixture } from './kbd.ssr.fixture'

test('hydrates semantic KbdGroup output and reacts to item changes', () => {
  const [keyName, setKeyName] = createSignal('escape')
  const [items, setItems] = createSignal<KbdGroupT.Item[]>(['ctrl', 'k'])
  const [separator, setSeparator] = createSignal<KbdGroupT.Base['separator']>()
  const { container } = hydrateFixture(
    '/src/element/kbd/kbd.ssr.fixture.tsx',
    'renderKbdFixture',
    () => <KbdHydrationFixture keyName={keyName()} items={items()} separator={separator()} />,
  )
  const key = container.querySelector('kbd')!
  const group = container.querySelector('[data-slot="kbd-group"]:not([aria-label])')!

  expect(key.textContent).toBe('Esc')
  expect(key.getAttribute('aria-label')).toBe('Escape')
  expect(group.tagName).toBe('KBD')
  expect(group.textContent).toBe('Ctrl/k')
  expect(group.querySelectorAll('[data-slot="kbd-group-item"]')).toHaveLength(2)
  expect(group.querySelector('[role="separator"]')).toBeNull()
  expect(group.querySelector('[aria-orientation]')).toBeNull()

  const customSeparator = group.querySelector('[data-slot="kbd-group-separator"]')!
  setItems(['p', 'ctrl', 'k'])
  expect(group.querySelectorAll('[data-slot="kbd-group-separator"]')[1]).toBe(customSeparator)
  expect(customSeparator.getAttribute('data-index')).toBe('1')

  setKeyName('tab')
  setItems(['shift', 'p'])
  expect(container.querySelector('kbd')).toBe(key)
  expect(key.getAttribute('aria-label')).toBe('Tab')
  expect(group.textContent).toBe('⇧/p')
  setSeparator('+')
  expect(group.textContent).toBe('⇧+p')
  expect(group.querySelector('[data-slot="kbd-group-separator"]')).toBeNull()
})
