import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { EmptyHydrationFixture } from './empty.ssr.fixture'
import type { EmptyT } from './empty.types'

test.each([true, false])(
  'hydrates parts and updates size and optional content (initially present=%s)',
  (initialOptional) => {
    const [size, setSize] = createSignal<EmptyT.Variant['size']>('sm')
    const [title, setTitle] = createSignal('No projects')
    const [optional, setOptional] = createSignal(initialOptional)
    const { container } = hydrateFixture(
      '/src/element/empty/empty.ssr.fixture.tsx',
      initialOptional ? 'renderEmptyFixture' : 'renderMinimalEmptyFixture',
      () => <EmptyHydrationFixture size={size()} title={title()} optional={optional()} />,
    )
    const root = container.firstElementChild
    const label = container.querySelector('[data-slot="empty-title"] span')!
    const description = container.querySelector('[data-slot="empty-description"]')!
    expect(container.querySelector('[data-slot="empty-media"]') !== null).toBe(initialOptional)
    expect(container.querySelector('[data-slot="empty-actions"]') !== null).toBe(initialOptional)
    setSize('lg')
    setTitle('Updated')
    expect(container.firstElementChild).toBe(root)
    expect(container.querySelector('[data-slot="empty-title"] span')).toBe(label)
    expect(label.textContent).toBe('Updated')
    expect(label.parentElement?.className).toContain('text-lg')
    expect(container.querySelector('[data-slot="empty-description"]')).toBe(description)
    expect(description.className).toContain('text-base')
    setOptional(!initialOptional)
    expect(container.querySelector('[data-slot="empty-media"]') !== null).toBe(!initialOptional)
    expect(container.querySelector('[data-slot="empty-actions"]') !== null).toBe(!initialOptional)
    setOptional(true)
    expect(container.querySelector('[data-slot="empty-actions"]')?.className).toContain('gap-4')
    expect(container.querySelector('[data-slot="empty-actions"] button')?.textContent).toBe(
      'Create project',
    )
  },
)
