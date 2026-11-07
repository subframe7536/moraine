import { waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { PinInput } from './pin-input'

describe('PinInput SSR Hydration', () => {
  test('hydrates default value and slot nodes stably', async () => {
    const [value, setValue] = createSignal(['1', '2', '3'])

    const { container } = hydrateFixture(
      '/src/components/pin-input/pin-input.ssr.fixture.tsx',
      'renderPinInputFixture',
      () => <PinInput id="test-pin" value={value()} length={5} />,
    )

    const root = container.querySelector('#test-pin-root')!
    expect(root).not.toBeNull()

    const inputs = container.querySelectorAll<HTMLInputElement>('[data-slot="pin-input-input"]')
    expect(inputs).toHaveLength(5)
    expect(inputs[0]?.value).toBe('1')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('3')
    expect(inputs[3]?.value).toBe('')
    expect(inputs[4]?.value).toBe('')

    setValue(['9', '8', '7'])
    await waitFor(() => expect(inputs[0]?.value).toBe('9'))
    expect(inputs[1]?.value).toBe('8')
    expect(inputs[2]?.value).toBe('7')
  })

  test('hydrates separators without replacing server nodes', () => {
    const { container } = hydrateFixture(
      '/src/components/pin-input/pin-input.ssr.fixture.tsx',
      'renderPinInputWithSeparatorsFixture',
      () => <PinInput id="sep-pin" defaultValue="123456" length={6} separator={3} />,
    )

    const root = container.querySelector('#sep-pin-root')!
    expect(root).not.toBeNull()

    const separators = container.querySelectorAll('[data-slot="pin-input-separator"]')
    expect(separators).toHaveLength(1)
  })
})
