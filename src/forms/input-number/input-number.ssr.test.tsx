import { waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { InputNumber } from './input-number.tsx'

describe('InputNumber SSR Hydration', () => {
  test('hydrates a formatted controlled value without replacing horizontal nodes', async () => {
    const [value, setValue] = createSignal(12.5)

    const { container } = hydrateFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderInputNumberFixture',
      () => <InputNumber id="horizontal-number" value={value()} locale="de-DE" />,
    )

    const horizontalRoot = container.querySelector('#horizontal-number-root')!
    const horizontalInput = container.querySelector<HTMLInputElement>('#horizontal-number')!

    expect(horizontalRoot).not.toBeNull()
    expect(horizontalInput).not.toBeNull()
    expect(horizontalInput.value).toBe('12,5')
    expect(
      Array.from(horizontalRoot.children).map((child) => child.getAttribute('data-slot')),
    ).toEqual(['decrement', 'input', 'increment'])

    setValue(13.5)
    await waitFor(() => expect(horizontalInput.value).toBe('13,5'))
  })

  test('hydrates vertical control order without replacing server nodes', () => {
    const { container } = hydrateFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderVerticalInputNumberFixture',
      () => (
        <InputNumber
          id="vertical-number"
          defaultValue={-2.5}
          locale="en-US"
          orientation="vertical"
        />
      ),
    )

    const root = container.querySelector('#vertical-number-root')!
    const input = container.querySelector<HTMLInputElement>('#vertical-number')!

    expect(root).not.toBeNull()
    expect(input).not.toBeNull()
    expect(root.querySelector('[data-slot="controls"]')).not.toBeNull()
    expect(input.value).toBe('-2.5')
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'input',
      'controls',
    ])
  })

  test('hydrates with both conditional controls hidden', () => {
    const { container } = hydrateFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderHiddenInputNumberFixture',
      () => (
        <InputNumber
          id="hidden-controls-number"
          defaultValue={3.25}
          locale="en-US"
          increment={false}
          decrement={false}
        />
      ),
    )

    const root = container.querySelector('#hidden-controls-number-root')!
    const input = container.querySelector<HTMLInputElement>('#hidden-controls-number')!

    expect(root).not.toBeNull()
    expect(input).not.toBeNull()
    expect(input.value).toBe('3.25')
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'input',
    ])
  })
})
