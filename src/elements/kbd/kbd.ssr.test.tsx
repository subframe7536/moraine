import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import type { KbdGroupT } from './kbd-group.types.ts'
import { KbdHydrationFixture } from './kbd.ssr.fixture.tsx'

test('hydrates key aliases and custom sequence dividers before updating keys', () => {
  const [keyName, setKeyName] = createSignal('escape')
  const [sequence, setSequence] = createSignal<KbdGroupT.Item[][]>([['ctrl', 'k'], ['enter']])
  const { container } = hydrateFixture(
    '/src/elements/kbd/kbd.ssr.fixture.tsx',
    'renderKbdFixture',
    () => <KbdHydrationFixture keyName={keyName()} sequence={sequence()} />,
  )
  const key = container.querySelector('kbd')!
  const chord = container.querySelector('[data-slot="chord"]')!
  expect(key.textContent).toBe('Esc')
  expect(key.getAttribute('aria-label')).toBe('Escape')
  expect(container.querySelector('[data-testid="chord-divider"]')?.textContent).toBe('Chord 0')
  expect(container.querySelector('[data-testid="sequence-divider"]')?.textContent).toBe('Step 0')
  setKeyName('tab')
  setSequence((previous) => [...previous, ['shift', 'p']])
  expect(container.querySelector('kbd')).toBe(key)
  expect(key.getAttribute('aria-label')).toBe('Tab')
  expect(container.querySelector('[data-slot="chord"]')).toBe(chord)
  expect(container.querySelectorAll('[data-testid="sequence-divider"]')).toHaveLength(2)
  expect(container.querySelectorAll('kbd')).toHaveLength(6)
})
