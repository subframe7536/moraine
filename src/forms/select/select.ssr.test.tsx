import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Select } from './select.tsx'
import type { SelectT } from './select.tsx'

describe('Select SSR Hydration', () => {
  test('hydrates the closed control in place and opens on the first keyboard action', () => {
    const reads = {
      options: 0,
      label: 0,
      description: 0,
      optionRender: 0,
      leadingIcon: 0,
      trailingIcon: 0,
      closeIcon: 0,
    }

    const { container } = hydrateFixture(
      '/src/forms/select/select.ssr.fixture.tsx',
      'renderSelectFixture',
      () =>
        createComponent(Select, {
          id: 'fruit',
          name: 'fruit',
          value: 'banana',
          allowClear: true,
          get options() {
            reads.options += 1
            return [
              {
                value: 'apple',
                get label() {
                  reads.label += 1
                  return 'Apple'
                },
                get description() {
                  reads.description += 1
                  return 'Crisp'
                },
              },
              {
                value: 'banana',
                get label() {
                  reads.label += 1
                  return 'Banana'
                },
                get description() {
                  reads.description += 1
                  return 'Sweet'
                },
              },
            ]
          },
          get optionRender() {
            reads.optionRender += 1
            return (props: SelectT.OptionRenderProps) => <span>{props.option?.label}</span>
          },
          get leadingIcon() {
            reads.leadingIcon += 1
            return 'icon-search' as const
          },
          get trailingIcon() {
            reads.trailingIcon += 1
            return 'icon-chevron-down' as const
          },
          get closeIcon() {
            reads.closeIcon += 1
            return 'icon-close' as const
          },
        }),
    )

    const root = container.querySelector('[data-slot="root"]')
    const control = container.querySelector('[data-slot="control"]')
    const clear = container.querySelector('[data-slot="clear"]')
    const nativeSelect = container.querySelector('select[name="fruit"]')
    const combobox = container.querySelector<HTMLElement>('[role="combobox"]')!

    expect(root).not.toBeNull()
    expect(control).not.toBeNull()
    expect(clear).not.toBeNull()
    expect(nativeSelect).not.toBeNull()
    expect(combobox.getAttribute('aria-expanded')).toBe('false')
    expect(reads).toEqual({
      options: 1,
      label: 2,
      description: 2,
      optionRender: 1,
      leadingIcon: 1,
      trailingIcon: 1,
      closeIcon: 1,
    })

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    expect(combobox.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.querySelectorAll('[data-slot="item"]')).toHaveLength(2)
    expect(reads.optionRender).toBe(1)
    expect(
      document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
    ).toContain('Apple')
  })
})
