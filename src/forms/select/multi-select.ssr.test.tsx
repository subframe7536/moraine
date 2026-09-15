import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { MultiSelect } from './multi-select'
import type { MultiSelectT } from './multi-select.types'

describe('MultiSelect SSR Hydration', () => {
  test('hydrates in place, removes a tag, and opens on the first ArrowDown', () => {
    const reads = {
      items: 0,
      label: 0,
      description: 0,
      itemRender: 0,
      tagRender: 0,
      emptyRender: 0,
    }
    const onChange = vi.fn()

    const { container } = hydrateFixture(
      '/src/forms/select/multi-select.ssr.fixture.tsx',
      'renderMultiSelectFixture',
      () =>
        createComponent(MultiSelect, {
          id: 'fruits',
          name: 'fruits',
          search: true,
          defaultValue: ['apple'],
          onChange,
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
            return (props: MultiSelectT.ItemRenderProps) => <span>{props.item?.label}</span>
          },
          get tagRender() {
            reads.tagRender += 1
            return undefined
          },
          get emptyRender() {
            reads.emptyRender += 1
            return undefined
          },
          get leadingIcon() {
            return 'icon-search' as const
          },
          get loadingIcon() {
            return 'icon-loading' as const
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
    const tag = container.querySelector('[data-slot="tag"]')
    const formInput = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="fruits"]',
    )
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!

    expect(root).toBeNull()
    expect(control).not.toBeNull()
    expect(tag).not.toBeNull()
    expect(formInput?.value).toBe('apple')
    expect(container.querySelector('select, option')).toBeNull()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(reads).toEqual({
      items: 1,
      label: 1,
      description: 0,
      itemRender: 0,
      tagRender: 1,
      emptyRender: 0,
    })

    fireEvent.click(container.querySelector('[aria-label="Remove Apple"]')!)

    expect(container.querySelector('[data-slot="tag"]')).toBeNull()
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([])

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.querySelectorAll('[data-slot="item"]')).toHaveLength(2)
    expect(
      document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
    ).toContain('Banana')
    expect(Object.values(reads)).toEqual([1, 3, 0, 1, 1, 0])
  })
})
