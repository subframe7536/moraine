import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Textarea } from './textarea'

describe('Textarea SSR Hydration', () => {
  test('reuses its only native element and initial value', () => {
    const { container } = hydrateFixture(
      '/src/components/textarea/textarea.ssr.fixture.tsx',
      'renderTextareaFixture',
      () => <Textarea id="ssr-textarea" value="Server value" />,
    )
    const textarea = container.firstElementChild as HTMLTextAreaElement
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.dataset.slot).toBe('textarea')
    expect(textarea.value).toBe('Server value')
  })

  test('keeps the server textarea node when its controlled value changes after hydration', () => {
    const [value, setValue] = createSignal('Server value')
    const { container } = hydrateFixture(
      '/src/components/textarea/textarea.ssr.fixture.tsx',
      'renderTextareaFixture',
      () => <Textarea id="ssr-textarea" value={value()} />,
    )
    const textarea = container.querySelector('textarea')!

    setValue('Client value')

    expect(container.querySelector('textarea')).toBe(textarea)
    expect(textarea.value).toBe('Client value')
  })
})
