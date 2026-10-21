import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { AlertHydrationFixture } from './alert.ssr.fixture'
import type { AlertT } from './alert.types'

test('hydrates alert fixture and updates reactive props', () => {
  const [type, setType] = createSignal<AlertT.Variants['type']>('info')
  const [title, setTitle] = createSignal('Alert title')
  const [description] = createSignal<string | undefined>('Detailed alert description')
  const { container } = hydrateFixture(
    '/src/element/alert/alert.ssr.fixture.tsx',
    'renderAlertFixture',
    () => <AlertHydrationFixture type={type()} title={title()} description={description()} close />,
  )
  const root = container.firstElementChild
  expect(root).toBeDefined()
  expect(root?.getAttribute('data-slot')).toBe('alert')
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Alert title')
  expect(container.querySelector('[data-slot="alert-description"]')?.textContent).toBe(
    'Detailed alert description',
  )
  expect(container.querySelector('[data-slot="alert-close"]')).not.toBeNull()

  setTitle('Updated title')
  setType('success')
  expect(container.firstElementChild).toBe(root)
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Updated title')
  expect(root?.getAttribute('data-type')).toBe('success')
})

test('hydrates minimal alert fixture without description or close', () => {
  const [title, setTitle] = createSignal('Minimal alert')
  const { container } = hydrateFixture(
    '/src/element/alert/alert.ssr.fixture.tsx',
    'renderMinimalAlertFixture',
    () => <AlertHydrationFixture type="default" title={title()} />,
  )
  const root = container.firstElementChild
  expect(root).toBeDefined()
  expect(root?.getAttribute('data-type')).toBe('default')
  expect(container.querySelector('[data-slot="alert-icon"]')).toBeNull()
  expect(container.querySelector('[data-slot="alert-close"]')).toBeNull()

  setTitle('Updated minimal')
  expect(container.querySelector('[data-slot="alert-title"]')?.textContent).toBe('Updated minimal')
})
