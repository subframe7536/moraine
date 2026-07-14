import { fireEvent, render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DocsCodeBlock } from './docs-code-block'

class ResizeObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
}

describe('DocsCodeBlock', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('renders plain Expressive Code HTML without adding another copy button', () => {
    const screen = render(() => (
      <DocsCodeBlock html='<div class="expressive-code"><pre><code>value</code></pre></div>' />
    ))

    expect(screen.getByText('value')).toBeDefined()
    expect(screen.container.querySelector('button')).toBeNull()
  })

  test('uses the compact integrated surface for install commands', () => {
    const screen = render(() => (
      <DocsCodeBlock
        variant="install"
        html='<div class="expressive-code"><pre><code>bun add moraine</code></pre></div>'
      />
    ))

    const wrapper = screen.container.firstElementChild
    expect(wrapper?.className).toContain('[&_')
    expect(screen.container.textContent).toContain('bun add moraine')
  })

  test('does not offer expansion for short source code', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100)
    const screen = render(() => (
      <DocsCodeBlock
        variant="source"
        html='<div class="expressive-code"><pre><code>short</code></pre></div>'
      />
    ))
    await Promise.resolve()

    expect(screen.queryByRole('button', { name: 'Expand code' })).toBeNull()
    const sourceContent = screen.container.querySelector('.expressive-code')?.parentElement
    expect(sourceContent?.className).toContain('[&_.docs-code-copy-toolbar]:sticky!')
    expect(sourceContent?.className).toContain('[&_.expressive-code_pre]:border-0!')
    expect(sourceContent?.className).toContain('[&_.expressive-code_pre]:rounded-none!')
  })

  test('expands long source code up to the maximum viewport height', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(600)
    const screen = render(() => (
      <DocsCodeBlock
        variant="source"
        html='<div class="expressive-code"><pre><code>long</code></pre></div>'
      />
    ))
    await Promise.resolve()

    const button = screen.getByRole('button', { name: 'Expand code' })
    const viewport = button.parentElement
    expect(viewport?.style.height).toBe('150px')

    fireEvent.click(button)

    expect(viewport?.style.height).toBe('400px')
    expect(screen.queryByRole('button', { name: 'Expand code' })).toBeNull()
  })
})
