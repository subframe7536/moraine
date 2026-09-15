import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Select } from './select'
import type { SelectT } from './select.types'

describe('Select SSR Hydration', () => {
  test('hydrates the closed control in place and opens on the first keyboard action', () => {
    const reads = {
      items: 0,
      label: 0,
      description: 0,
      itemRender: 0,
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
          get items() {
            reads.items += 1
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
          get itemRender() {
            reads.itemRender += 1
            return (props: SelectT.ItemRenderProps) => <span>{props.item?.label}</span>
          },
          get leadingIcon() {
            return 'icon-search' as const
          },
          get trailingIcon() {
            return 'icon-chevron-down' as const
          },
          get closeIcon() {
            return 'icon-close' as const
          },
        }),
    )

    const root = container.querySelector('[data-slot="root"]')
    const control = container.querySelector('[data-slot="control"]')
    const clear = container.querySelector('[data-slot="clear"]')
    const formInput = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="fruit"]',
    )
    const combobox = container.querySelector<HTMLElement>('[role="combobox"]')!

    expect(root).toBeNull()
    expect(control).not.toBeNull()
    expect(clear).not.toBeNull()
    expect(formInput?.value).toBe('banana')
    expect(container.querySelector('select, option')).toBeNull()
    expect(combobox.getAttribute('aria-expanded')).toBe('false')
    expect(reads).toEqual({
      items: 1,
      label: 1,
      description: 0,
      itemRender: 0,
    })

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    expect(combobox.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.querySelectorAll('[data-slot="item"]')).toHaveLength(2)
    expect(reads.itemRender).toBe(1)
    expect(
      document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
    ).toContain('Apple')
  })
})
