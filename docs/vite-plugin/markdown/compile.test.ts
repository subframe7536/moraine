// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './compile'

describe('compileMarkdownPage', () => {
  test('compiles mdx frontmatter metadata into runtime page input', () => {
    const markdown = `---
category: general
component: Button
description: "Button docs"
---

## Usage
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.mdx')

    expect(code).toContain('frontmatter:')
    expect(code).toContain('"category":"general"')
    expect(code).toContain('"component":"Button"')
  })

  test('compiles mdx examples with inferred source imports', () => {
    const markdown = `
## Variants

Use button variants.

<Example name="Variants" />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.mdx', {
      projectRoot: process.cwd(),
    })

    expect(code).toContain("from '../../../components/markdown'")
    expect(code).toContain('componentKey: "button"')
    expect(code).toContain('ExampleComponent0')
    expect(code).toContain("from './examples/variants.tsx'")
    expect(code).toContain('?example-source&name=Variants')
    expect(code).toContain('Content: MDXContent')
    expect(code).toContain('id: "variants"')
    expect(code).toContain('href: "#variants"')
    expect(code).toContain('"id":"variants"')
    expect(code).toContain('"label":"Variants","level":1')
  })

  test('ignores h1 and collects h2-h5 for toc with normalized levels', () => {
    const markdown = `
# Intro
## Usage
### Advanced
#### Edge Cases
##### Notes
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/introduction.mdx')
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

  test('injects api toc entries from compile-time docs when DocsApiReference exists', () => {
    const markdown = `
## Variants

<DocsApiReference />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/input/input.mdx', {
      projectRoot: process.cwd(),
    })
    expect(code).not.toContain('"id":"input"')
    expect(code).toContain('"id":"variants"')
    expect(code).toContain('"id":"api-ref"')
    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"id":"api-props"')
    expect(code).not.toContain('"id":"api-aria"')
    expect(code).not.toContain('"id":"api-data-attributes"')
    expect(code).toContain('"label":"Attributes"')
    expect(code).toContain('"label":"Props"')
    expect(code).toContain('"name":"aria-disabled"')
    expect((code.match(/"id":"api-ref","label":"API Reference","level":1/g) ?? []).length).toBe(1)
  })

  test('renders api slots as titled sections with slot-specific metadata tables', () => {
    const markdown = `
<DocsApiReference />
`

    const code = compileMarkdownPage(
      markdown,
      '/tmp/docs/pages/navigation/command-palette/command-palette.mdx',
      {
        projectRoot: process.cwd(),
      },
    )

    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"slots":[{"name":"root"')
    expect(code).toContain('"name":"item"')
    expect(code).toContain('"dataAttributes":[{"name":"data-disabled"')
    expect(code).toContain('"name":"data-highlighted"')
    expect(code).toContain('"ariaAttributes":[{"name":"aria-disabled"')
  })

  test('passes static DocsHeader apiDocOverride to api attributes sections', () => {
    const markdown = `
<DocsHeader apiDocOverride={{
  component: {
    key: 'custom',
    name: 'Custom',
    category: 'Form',
    polymorphic: false
  },
  slots: [{ name: 'root', description: 'Root wrapper element.' }],
  props: { own: [], inherited: [] }
}} />

<DocsApiReference />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.mdx')

    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"slots":[{"name":"root","description":"Root wrapper element."')
  })

  test('injects conditional api toc entries for slots/items/inherited', () => {
    const markdown = `
<DocsHeader apiDocOverride={{
  component: {
    key: 'custom',
    name: 'Custom',
    category: 'Form',
    polymorphic: false
  },
  slots: ['root'],
  props: {
    own: [],
    inherited: [{ from: 'Base', props: [] }]
  },
  items: { props: [] }
}} />

## Demo

<DocsApiReference />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.mdx')
    expect(code).toContain('"id":"api-ref"')
    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"id":"api-items"')
    expect(code).toContain('"id":"api-inherited"')
    expect(code).toContain('"label":"Inherited"')
    expect(code).not.toContain('"id":"api-props"')
  })

  test('uses explicit source override when provided', () => {
    const markdown = `
<Example name="Variants" source="./examples/button-variants.tsx" />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.mdx')
    expect(code).toContain("from './examples/button-variants.tsx'")
  })

  test('uses page-key examples directory for group-level mdx pages', () => {
    const markdown = `
<Example name="Variants" />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button.mdx')
    expect(code).toContain("from './button/examples/variants.tsx'")
  })

  test('supports standalone mdx widget components', () => {
    const markdown = `
<IntroCards />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/introduction.mdx')
    expect(code).toContain("from '../components/markdown'")
    expect(code).not.toContain('componentKey:')
    expect(code).toContain('const { IntroCards } = props.components || {};')
    expect(code).toContain('return _jsx(IntroCards, {});')
  })

  test('supports CodeTabs component', () => {
    const markdown = `
<CodeTabs package="solid-toaster" />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.mdx', {
      highlightCode: (source, lang) => `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain('return _jsx(CodeTabs, { package: "solid-toaster" });')
    expect(code).toContain('bun add solid-toaster')
    expect(code).toContain('shiki bash')
  })

  test('renders fenced code through ShikiCodeBlock without executing jsx-looking text', () => {
    const markdown = `
\`\`\`tsx
<Button />
\`\`\`
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/overlay/toast/toast.mdx', {
      highlightCode: (source, lang) => `<pre class="shiki ${lang}"><code>${source}</code></pre>`,
    })

    expect(code).toContain('return _jsx(ShikiCodeBlock, { html:')
    expect(code).toContain('<Button />')
    expect(code).not.toContain('<Button />;')
  })

  test('deduplicates repeated heading anchors', () => {
    const markdown = `
## Same Heading

Some content.

## Same Heading
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/textarea/textarea.mdx')
    expect(code).toContain('id: "same-heading"')
    expect(code).toContain('href: "#same-heading"')
    expect(code).toContain('id: "same-heading-2"')
    expect(code).toContain('href: "#same-heading-2"')
    expect(code).toContain('"id":"same-heading"')
    expect(code).toContain('"id":"same-heading-2"')
  })
})
