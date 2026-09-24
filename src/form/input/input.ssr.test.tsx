import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test.ts'

import { Input } from './input.tsx'

describe('Input SSR Hydration', () => {
  test('reuses its only native element and preserves controlled value behavior', async () => {
    const [value, setValue] = createSignal('Server value')
    const onValueChange = vi.fn()
    const { container } = hydrateFixture(
      '/src/form/input/input.ssr.fixture.tsx',
      'renderInputFixture',
      () => <Input value={value()} modelModifiers={{ trim: true }} onValueChange={onValueChange} />,
    )
    const input = container.firstElementChild as HTMLInputElement
    expect(input.tagName).toBe('INPUT')
    expect(input.dataset.slot).toBe('input')
    expect(input.value).toBe('Server value')
    setValue('Client value')
    await waitFor(() => expect(input.value).toBe('Client value'))
    fireEvent.input(input, { target: { value: 'Rejected value' } })
    expect(onValueChange).toHaveBeenCalledWith('Rejected value')
    expect(input.value).toBe('Client value')
  })
})
