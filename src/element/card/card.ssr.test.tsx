import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test.ts'

import { CardHydrationFixture } from './card.ssr.fixture.tsx'

test.each([true, false])(
  'hydrates compound parts and updates conditional body (initially present=%s)',
  (initialBody) => {
    const [title, setTitle] = createSignal('Title')
    const [body, setBody] = createSignal(initialBody)
    const { container } = hydrateFixture(
      '/src/element/card/card.ssr.fixture.tsx',
      initialBody ? 'renderCardFixture' : 'renderEmptyCardFixture',
      () => <CardHydrationFixture title={title()} body={body()} />,
    )
    const root = container.firstElementChild
    const label = container.querySelector('[data-slot="card-title"] span')!
    expect(container.querySelector('[data-slot="card-body"]') !== null).toBe(initialBody)
    expect(container.querySelector('[data-slot="card-action"] button')?.textContent).toBe('Edit')
    setTitle('Updated')
    setBody(!initialBody)
    expect(container.firstElementChild).toBe(root)
    expect(container.querySelector('[data-slot="card-title"] span')).toBe(label)
    expect(label.textContent).toBe('Updated')
    expect(container.querySelector('[data-slot="card-body"]') !== null).toBe(!initialBody)
  },
)
