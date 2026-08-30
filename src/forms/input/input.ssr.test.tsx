import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Input } from './input.tsx'

describe('Input SSR Hydration', () => {
  test('hydrates controlled value and slot order without replacing server nodes', async () => {
    const [value, setValue] = createSignal('Server value')
    const onValueChange = vi.fn()
    const reads = { children: 0, leading: 0, loadingIcon: 0, modelModifiers: 0, trailing: 0 }

    const { container } = hydrateFixture(
      '/src/forms/input/input.ssr.fixture.tsx',
      'renderInputFixture',
      () =>
        createComponent(Input, {
          get value() {
            return value()
          },
          get leading() {
            reads.leading += 1
            return 'i-lucide-search'
          },
          get trailing() {
            reads.trailing += 1
            return 'i-lucide-at-sign'
          },
          get loadingIcon() {
            reads.loadingIcon += 1
            return 'icon-loading'
          },
          get modelModifiers() {
            reads.modelModifiers += 1
            return { trim: true }
          },
          get children() {
            reads.children += 1
            return (
              <button type="button" data-testid="nested-action">
                Action
              </button>
            )
          },
          onValueChange,
        }),
    )

    const root = container.querySelector('[data-slot="root"]')!
    const input = container.querySelector<HTMLInputElement>('[data-slot="input"]')!

    expect(root).not.toBeNull()
    expect(input).not.toBeNull()
    expect(container.querySelector('[data-testid="nested-action"]')).not.toBeNull()
    expect(input.value).toBe('Server value')
    expect(Array.from(root.children).map((element) => element.getAttribute('data-slot'))).toEqual([
      'leading',
      'input',
      null,
      'trailing',
    ])
    expect(reads).toEqual({
      children: 1,
      leading: 1,
      loadingIcon: 1,
      modelModifiers: 1,
      trailing: 1,
    })

    setValue('Client value')
    await waitFor(() => expect(input.value).toBe('Client value'))

    fireEvent.input(input, {
      target: { value: 'Rejected value' },
      currentTarget: { value: 'Rejected value' },
    })
    expect(onValueChange).toHaveBeenCalledWith('Rejected value')
    expect(input.value).toBe('Client value')
  })
})
