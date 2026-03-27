import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './example-markdown'

describe('compileMarkdownPage', () => {
  test('compiles markdown with inferred component key and inferred example source', () => {
    const markdown = `
## Variants

Use button variants.

:::example
name: Variants
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.md', {
      projectRoot: process.cwd(),
    })

    expect(code).toContain("from '../../../components/markdown'")
    expect(code).toContain('componentKey: "button"')
    expect(code).toContain('ExampleComponent0')
    expect(code).toContain("from './examples/variants.tsx'")
    expect(code).toContain('?example-source&name=Variants')
    expect(code).toContain("type: 'markdown'")
  })

  test('uses explicit source override when provided', () => {
    const markdown = `
:::example
name: Variants
source: ./examples/button-variants.tsx
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.md')

    expect(code).toContain("from './examples/button-variants.tsx'")
  })

  test('supports :::widget directive', () => {
    const markdown = `
:::widget
name: intro-cards
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/introduction.md')
    expect(code).toContain("from '../components/markdown'")
    expect(code).not.toContain('componentKey:')
    expect(code).toContain('widgetName: "intro-cards"')
  })

  test('supports :::code-tabs directive', () => {
    const markdown = `
:::code-tabs
package: solid-toaster
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.md', {
      highlightCode: (source, lang) =>
        `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain("type: 'code-tabs'")
    expect(code).toContain('bun add solid-toaster')
    expect(code).toContain('shiki bash')
  })

  test('requires package for :::code-tabs directive', () => {
    const markdown = `
:::code-tabs
name: solid-toaster
:::
`

    expect(() => compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.md')).toThrow(
      ':::code-tabs requires "package"',
    )
  })

  test('renders fenced code with highlight callback output', () => {
    const markdown = `
\`\`\`bash
bun add solid-toaster
\`\`\`
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.md', {
      highlightCode: (source, lang) =>
        `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain('shiki bash')
    expect(code).not.toContain('language-bash')
  })
})
