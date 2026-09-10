import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { CardHydrationFixture } from './card.ssr.fixture.tsx'

test.each([true, false])(
  'hydrates JSX slots and updates conditional body (initially present=%s)',
  (initialBody) => {
    const [title, setTitle] = createSignal('Title')
    const [body, setBody] = createSignal(initialBody)
    const { container } = hydrateFixture(
      '/src/elements/card/card.ssr.fixture.tsx',
      initialBody ? 'renderCardFixture' : 'renderEmptyCardFixture',
      () => <CardHydrationFixture title={title()} body={body()} />,
    )
    const root = container.firstElementChild
    const label = container.querySelector('[data-slot="title"] span')!
    expect(container.querySelector('[data-slot="body"]') !== null).toBe(initialBody)
    expect(container.querySelector('[data-slot="action"] button')?.textContent).toBe('Edit')
    setTitle('Updated')
    setBody(!initialBody)
    expect(container.firstElementChild).toBe(root)
    expect(container.querySelector('[data-slot="title"] span')).toBe(label)
    expect(label.textContent).toBe('Updated')
    expect(container.querySelector('[data-slot="body"]') !== null).toBe(!initialBody)
  },
)
