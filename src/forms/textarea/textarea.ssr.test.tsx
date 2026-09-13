import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Textarea } from './textarea.tsx'

describe('Textarea SSR Hydration', () => {
  test('reuses its only native element and initial value', () => {
    const { container } = hydrateFixture(
      '/src/forms/textarea/textarea.ssr.fixture.tsx',
      'renderTextareaFixture',
      () => <Textarea id="ssr-textarea" value="Server value" />,
    )
    const textarea = container.firstElementChild as HTMLTextAreaElement
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.dataset.slot).toBe('root')
    expect(textarea.value).toBe('Server value')
  })
})
