import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { AvatarHydrationFixture } from './avatar.ssr.fixture'

test('hydrates a real image src and group overflow', () => {
  const [max, setMax] = createSignal(1)
  const { container } = hydrateFixture(
    '/src/element/avatar/avatar.ssr.fixture.tsx',
    'renderAvatarFixture',
    () => <AvatarHydrationFixture max={max()} />,
  )
  const image = container.querySelector('img')!
  const badge = container.querySelector('[data-slot="avatar-badge"]')!
  expect(image.getAttribute('src')).toBe('/avatar.png')
  image.dispatchEvent(new Event('load'))
  expect(image.getAttribute('data-status')).toBe('loaded')
  expect(image.getAttribute('aria-hidden')).not.toBe('true')
  expect(badge.textContent).toBe('Online')
  expect(container.querySelector('[data-slot="avatar-group-count"]')?.textContent).toBe('+1')
  setMax(2)
  expect(container.querySelectorAll('[data-slot="avatar-group-item"]')).toHaveLength(2)
  expect(container.querySelector('[data-slot="avatar-group-count"]')).toBeNull()
  expect(container.querySelector('img')).toBe(image)
  expect(container.querySelector('[data-slot="avatar-badge"]')).toBe(badge)
})
