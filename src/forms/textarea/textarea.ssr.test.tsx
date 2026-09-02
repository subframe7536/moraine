import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Textarea } from './textarea'

describe('Textarea SSR Hydration', () => {
  test('hydrates slots and initial value without replacing server nodes', () => {
    const { container } = hydrateFixture(
      '/src/forms/textarea/textarea.ssr.fixture.tsx',
      'renderTextareaFixture',
      () => (
        <Textarea id="ssr-textarea" value="Server value" header={0} footer="Footer">
          <span data-testid="child">Child</span>
        </Textarea>
      ),
    )

    const serverRoot = container.querySelector('[data-slot="root"]') as HTMLElement
    const serverTextarea = container.querySelector('textarea') as HTMLTextAreaElement
    const serverHeader = container.querySelector('[data-slot="header"]') as HTMLElement

    expect(serverRoot).not.toBeNull()
    expect(serverTextarea).not.toBeNull()
    expect(serverHeader).not.toBeNull()
    expect(serverTextarea.value).toBe('Server value')
    expect(Array.from(serverRoot.children).map((child) => child.getAttribute('data-slot'))).toEqual(
      ['header', 'input', null, 'footer'],
    )
  })
})
