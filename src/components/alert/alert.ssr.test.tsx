import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { AlertHydrationFixture } from './alert.ssr.fixture'
import type { AlertT } from './alert.types'
test('hydrates alert fixture and updates reactive props', () => {
  const [tone, setTone] = createSignal<AlertT.Variants['tone']>('info')
  const [title, setTitle] = createSignal('Alert title')
  const [description] = createSignal<string | undefined>('Detailed alert description')
  const { container } = hydrateFixture(
    '/src/components/alert/alert.ssr.fixture.tsx',
    'renderAlertFixture',
    () => (
      <AlertHydrationFixture tone={tone()} title={title()} description={description()} closable />
    ),
  )
  const root = container.firstElementChild
  expect(root).toBeDefined()
  expect(root?.getAttribute('data-slot')).toBe('alert')
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Alert title')
  expect(container.querySelector('[data-slot="alert-description"]')?.textContent).toBe(
    'Detailed alert description',
  )
  expect(container.querySelector('[data-slot="alert-close"]')).not.toBeNull()

  flush(() => setTitle('Updated title'))
  flush(() => setTone('success'))
  expect(container.firstElementChild).toBe(root)
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Updated title')
  expect(root?.getAttribute('data-tone')).toBe('success')
})

test('hydrates minimal alert fixture without description or close', () => {
  const [title, setTitle] = createSignal('Minimal alert')
  const { container } = hydrateFixture(
    '/src/components/alert/alert.ssr.fixture.tsx',
    'renderMinimalAlertFixture',
    () => <AlertHydrationFixture tone="default" title={title()} />,
  )
  const root = container.firstElementChild
  expect(root).toBeDefined()
  expect(root?.getAttribute('data-tone')).toBe('default')
  expect(container.querySelector('[data-slot="alert-icon"]')).toBeNull()
  expect(container.querySelector('[data-slot="alert-close"]')).toBeNull()

  flush(() => setTitle('Updated minimal'))
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Updated minimal')
})
