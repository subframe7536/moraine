import { createSignal, flush } from 'solid-js'
import { expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import type { KbdGroupT } from '../kbd-group/kbd-group.types'

import { KbdHydrationFixture } from './kbd.ssr.fixture'
it('hydrates semantic KbdGroup output and reacts to item changes', () => {
  const [keyName, setKeyName] = createSignal('escape')
  const [items, setItems] = createSignal<Array<KbdGroupT.Item>>(['ctrl', 'k'])
  const [separator, setSeparator] = createSignal<KbdGroupT.Base['separator']>()
  const { container } = hydrateFixture(
    '/src/components/kbd/kbd.ssr.fixture.tsx',
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
  flush(() => setItems(['p', 'ctrl', 'k']))
  expect(group.querySelectorAll('[data-slot="kbd-group-separator"]')[1]).toBe(customSeparator)
  expect(customSeparator.getAttribute('data-index')).toBe('1')

  flush(() => setKeyName('tab'))
  flush(() => setItems(['shift', 'p']))
  expect(container.querySelector('kbd')).toBe(key)
  expect(key.getAttribute('aria-label')).toBe('Tab')
  expect(group.textContent).toBe('⇧/p')
  flush(() => setSeparator('+'))
  expect(group.textContent).toBe('⇧+p')
  expect(group.querySelector('[data-slot="kbd-group-separator"]')).toBeNull()
})
