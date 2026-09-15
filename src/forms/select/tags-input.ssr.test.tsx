import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { TagsInput } from './tags-input.tsx'

test('hydrates TagsInput tags, input, and form values in place', () => {
  const onChange = vi.fn()
  const { container } = hydrateFixture(
    '/src/forms/select/tags-input.ssr.fixture.tsx',
    'renderTagsInputFixture',
    () =>
      createComponent(TagsInput, {
        id: 'tags',
        name: 'tags',
        defaultValue: ['alpha', 'beta'],
        allowClear: true,
        onChange,
      }),
  )
  const input = container.querySelector<HTMLInputElement>('[data-slot="input"]')!
  expect(container.querySelectorAll('[data-slot="tag"]')).toHaveLength(2)
  expect(container.querySelector('[data-slot="tagOverflow"]')).toBeNull()
  expect(
    Array.from(container.querySelectorAll<HTMLInputElement>('input[name="tags"]')).map(
      (element) => element.value,
    ),
  ).toEqual(['alpha', 'beta'])
  fireEvent.input(input, { target: { value: 'gamma' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith(['alpha', 'beta', 'gamma'])
})
