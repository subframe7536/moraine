import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { DocsCodeBlock } from './docs-code-block'

describe('DocsCodeBlock', () => {
  test('renders plain variant with small copy button classes on root container', () => {
    const html =
      '<div class="expressive-code"><figure class="frame"><div class="copy"><button title="Copy to clipboard"><div></div></button></div><pre><code>const a = 1</code></pre></figure></div>'
    const screen = render(() => <DocsCodeBlock html={html} />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('[&_.expressive-code_.copy_button]:size-6!')
    expect(root.className).toContain('[&_.expressive-code_.copy_button::after]:m-1!')
    expect(root.innerHTML).toContain('class="expressive-code"')
  })

  test('renders install variant with install classes', () => {
    const html = '<div class="expressive-code"><pre><code>bun add moraine</code></pre></div>'
    const screen = render(() => <DocsCodeBlock variant="install" html={html} />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('[&_.expressive-code_pre>code]:py-2!')
  })

  test('renders source variant with expandable viewport container', () => {
    const html =
      '<div class="expressive-code"><figure class="frame"><div class="docs-code-copy-toolbar"><div class="copy"><button><div></div></button></div></div><pre><code>const a = 1</code></pre></figure></div>'
    const screen = render(() => <DocsCodeBlock variant="source" html={html} />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('group relative my-0 overflow-hidden border-t')
    expect(root.innerHTML).toContain('class="expressive-code"')
  })
})
