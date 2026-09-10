import { createSignal } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { AvatarHydrationFixture } from './avatar.ssr.fixture.tsx'

afterEach(() => vi.unstubAllGlobals())

test('hydrates fallback JSX and group overflow while a cached image loads', () => {
  vi.stubGlobal(
    'Image',
    class {
      complete = true
      naturalWidth = 100
      src = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
    },
  )
  const [max, setMax] = createSignal(1)
  const { container } = hydrateFixture(
    '/src/elements/avatar/avatar.ssr.fixture.tsx',
    'renderAvatarFixture',
    () => <AvatarHydrationFixture max={max()} />,
  )
  const image = container.querySelector('img')!
  const badge = container.querySelector('[data-slot="badge"]')!
  expect(image.getAttribute('src')).toBe('/avatar.png')
  expect(image.getAttribute('data-status')).toBe('loaded')
  expect(image.getAttribute('aria-hidden')).not.toBe('true')
  expect(badge.textContent).toBe('Online')
  expect(container.querySelector('[data-slot="count"]')?.textContent).toBe('+1')
  setMax(2)
  expect(container.querySelectorAll('[data-slot="item"]')).toHaveLength(2)
  expect(container.querySelector('[data-slot="count"]')).toBeNull()
  expect(container.querySelector('img')).toBe(image)
  expect(container.querySelector('[data-slot="badge"]')).toBe(badge)
})
