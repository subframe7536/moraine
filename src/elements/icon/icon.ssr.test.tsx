import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { IconHydrationFixture } from './icon.ssr.fixture.tsx'

test('hydrates class, conditional JSX, and component icons with reactive props', () => {
  const [label, setLabel] = createSignal('Status')
  const [visible, setVisible] = createSignal(true)
  const { container } = hydrateFixture(
    '/src/elements/icon/icon.ssr.fixture.tsx',
    'renderIconFixture',
    () => <IconHydrationFixture label={label()} visible={visible()} />,
  )
  const glyph = container.querySelector('[data-testid="component-icon"]')!
  expect(container.querySelector('.i-lucide-check')?.getAttribute('aria-hidden')).toBe('true')
  expect(container.querySelector('[data-testid="jsx-icon"] path')).not.toBeNull()
  setLabel('Updated status')
  expect(container.querySelector('[data-testid="component-icon"]')).toBe(glyph)
  expect(glyph.getAttribute('aria-label')).toBe('Updated status')
  expect(glyph.textContent).toBe('Updated status')
  setVisible(false)
  expect(container.querySelector('[data-testid="jsx-icon"]')).toBeNull()
  setVisible(true)
  expect(container.querySelector('[data-testid="jsx-icon"] path')).not.toBeNull()
})
