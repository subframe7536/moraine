import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './compile'

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
    expect(code).toContain('onThisPageEntries:')
    expect(code).toContain('"id":"variants"')
    expect(code).toContain('"label":"Variants"')
    expect(code).toContain('"label":"Variants","level":1')
    expect(code).toContain('id=\\"variants\\"')
    expect(code).toContain('href=\\"#variants\\"')
  })

  test('ignores h1 and collects h2-h5 for toc with normalized levels', () => {
    const markdown = `
# Intro
## Usage
### Advanced
#### Edge Cases
##### Notes
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/introduction.md')
    expect(code).toContain('onThisPageEntries:')
    expect(code).not.toContain('"id":"intro","label":"Intro"')
    expect(code).toContain('"id":"usage"')
    expect(code).toContain('"label":"Usage","level":1')
    expect(code).toContain('"id":"advanced"')
    expect(code).toContain('"label":"Advanced","level":2')
    expect(code).toContain('"id":"edge-cases"')
    expect(code).toContain('"label":"Edge Cases","level":3')
    expect(code).toContain('"id":"notes"')
    expect(code).toContain('"label":"Notes","level":4')
  })

  test('injects api toc entries from compile-time docs when docs-api-reference widget exists', () => {
    const markdown = `
## Variants

## API Reference

:::widget
name: docs-api-reference
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/input/input.md', {
      projectRoot: process.cwd(),
    })
    expect(code).not.toContain('"id":"input"')
    expect(code).toContain('"id":"variants"')
    expect(code).toContain('"id":"api-reference"')
    expect(code).toContain('id=\\"api-reference\\"')
    expect(code).toContain('"id":"api-props"')
    expect(code).toContain('"label":"Props"')
    expect(
      (code.match(/"id":"api-reference","label":"API Reference","level":1/g) ?? []).length,
    ).toBe(1)
  })

  test('does not inject api toc entries without docs-api-reference widget', () => {
    const markdown = `
## Variants
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/input/input.md', {
      projectRoot: process.cwd(),
    })

    expect(code).toContain('"id":"variants"')
    expect(code).not.toContain('"id":"api-reference"')
    expect(code).not.toContain('"id":"api-slots"')
    expect(code).not.toContain('"id":"api-props"')
    expect(code).not.toContain('"id":"api-items"')
    expect(code).not.toContain('"id":"api-inherited"')
  })

  test('injects kobalteHref for kobalte-based component pages', () => {
    const markdown = `
## Variants
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.md', {
      projectRoot: process.cwd(),
    })

    expect(code).toContain('kobalteHref: "https://kobalte.dev/docs/core/components/button"')
  })

  test('does not inject kobalteHref for non-kobalte component pages', () => {
    const markdown = `
## Demo

:::widget
name: docs-api-reference
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/card/card.md', {
      projectRoot: process.cwd(),
    })

    expect(code).not.toContain('kobalteHref:')
  })

  test('injects conditional api toc entries for slots/items/inherited', () => {
    const markdown = `
:::widget
name: docs-header
props:
  apiDocOverride:
    component:
      key: custom
      name: Custom
      category: Form
      polymorphic: false
    slots:
      - root
    props:
      own: []
      inherited:
        - from: Base
          props: []
    items:
      props: []
:::

## Demo

## API Reference

:::widget
name: docs-api-reference
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.md')
    expect(code).toContain('"id":"api-reference"')
    expect(code).toContain('"id":"api-slots"')
    expect(code).toContain('"id":"api-items"')
    expect(code).toContain('"id":"api-inherited"')
    expect(code).toContain('"label":"Inherited"')
    expect(code).not.toContain('"id":"api-props"')
  })

  test('injects a single inherited toc entry even with multiple inherited sources', () => {
    const markdown = `
:::widget
name: docs-header
props:
  apiDocOverride:
    component:
      key: custom
      name: Custom
      category: Form
      polymorphic: false
    slots: []
    props:
      own: []
      inherited:
        - from: BaseItem
          props: []
        - from: BaseItem
          props: []
:::

## Demo

## API Reference

:::widget
name: docs-api-reference
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.md')
    expect(code).toContain('"id":"api-inherited","label":"Inherited","level":2')
    expect(code).not.toContain('"id":"api-inherited-base-item"')
    expect(code).not.toContain('"id":"api-inherited-base-item-2"')
  })

  test('ignores frontmatter apiDocOverride', () => {
    const markdown = `---
apiDocOverride:
  component:
    key: custom
    name: Custom
    category: Form
    polymorphic: false
  slots:
    - root
  props:
    own: []
    inherited: []
---
## API Reference

:::widget
name: docs-api-reference
:::
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.md')
    expect(code).not.toContain('apiDoc:')
    expect(code).not.toContain('"id":"api-slots"')
    expect(code).not.toContain('"id":"api-props"')
    expect(code).not.toContain('"id":"api-items"')
    expect(code).not.toContain('"id":"api-inherited"')
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
      highlightCode: (source, lang) => `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain("type: 'code-tabs'")
    expect(code).toContain('bun add solid-toaster')
    expect(code).toContain('shiki bash')
  })

  test('renders fenced code with highlight callback output', () => {
    const markdown = `
\`\`\`bash
bun add solid-toaster
\`\`\`
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.md', {
      highlightCode: (source, lang) => `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain('shiki bash')
    expect(code).not.toContain('language-bash')
  })

  test('deduplicates repeated heading anchors', () => {
    const markdown = `
## Same Heading

Some content.

## Same Heading
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/textarea/textarea.md')
    expect(code).toContain('id=\\"same-heading\\"')
    expect(code).toContain('href=\\"#same-heading\\"')
    expect(code).toContain('id=\\"same-heading-2\\"')
    expect(code).toContain('href=\\"#same-heading-2\\"')
    expect(code).toContain('"id":"same-heading"')
    expect(code).toContain('"id":"same-heading-2"')
  })
})
