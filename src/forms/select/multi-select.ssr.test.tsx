import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectT } from './multi-select.tsx'

describe('MultiSelect SSR Hydration', () => {
  test('hydrates in place, removes a tag, and opens on the first ArrowDown', () => {
    const reads = {
      options: 0,
      label: 0,
      description: 0,
      optionRender: 0,
      tagRender: 0,
      labelRender: 0,
      emptyRender: 0,
      leadingIcon: 0,
      loadingIcon: 0,
      trailingIcon: 0,
      closeIcon: 0,
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
            return (props: MultiSelectT.OptionRenderProps) => <span>{props.option?.label}</span>
          },
          get tagRender() {
            reads.tagRender += 1
            return undefined
          },
          get labelRender() {
            reads.labelRender += 1
            return undefined
          },
          get emptyRender() {
            reads.emptyRender += 1
            return undefined
          },
          get leadingIcon() {
            reads.leadingIcon += 1
            return 'icon-search' as const
          },
          get loadingIcon() {
            reads.loadingIcon += 1
            return 'icon-loading' as const
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
    const tag = container.querySelector('[data-slot="tag"]')
    const nativeSelect = container.querySelector('select[name="fruits"]')
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!

    expect(root).not.toBeNull()
    expect(control).not.toBeNull()
    expect(tag).not.toBeNull()
    expect(nativeSelect).not.toBeNull()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(reads).toEqual({
      options: 1,
      label: 2,
      description: 2,
      optionRender: 1,
      tagRender: 1,
      labelRender: 1,
      emptyRender: 1,
      leadingIcon: 1,
      loadingIcon: 1,
      trailingIcon: 1,
      closeIcon: 1,
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
    expect(Object.values(reads)).toEqual([1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1])
  })
})
