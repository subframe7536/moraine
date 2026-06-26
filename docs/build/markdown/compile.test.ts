// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './compile'

const API_REFERENCE_HEADING = `## API Reference`

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

  test('compiles explicit mdx example imports without generated example maps', () => {
    const markdown = `
import { DemoButtonVariants } from './variants?example'

## Variants

Use button variants.

<DemoButtonVariants />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.mdx', {
      projectRoot: process.cwd(),
    })

    expect(code).toContain("from '../../../components/markdown'")
    expect(code).toContain('from "./variants?example"')
    expect(code).toContain('DemoButtonVariants')
    expect(code).not.toContain('ExampleComponent0')
    expect(code).not.toContain('?example-source&name=Variants')
    expect(code).not.toContain('examples')
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
<DocsHeader apiDocOverride={{
  component: {
    key: 'input',
    name: 'Input',
    category: 'Form',
    polymorphic: false
  },
  slots: [{ name: 'root' }],
  props: {
    own: [{ name: 'value', required: false, type: 'string' }],
    inherited: []
  }
}} />

## Variants

${API_REFERENCE_HEADING}

<DocsApiReference />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/input/input.mdx', {
      projectRoot: process.cwd(),
    })
    expect(code).not.toContain('"id":"input"')
    expect(code).toContain('"id":"variants"')
    expect(code).toContain('"id":"api-reference"')
    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"id":"api-props"')
    expect(code).not.toContain('"id":"api-aria"')
    expect(code).not.toContain('"id":"api-data-attributes"')
    expect(code).toContain('"label":"Attributes"')
    expect(code).toContain('"label":"Props"')
    expect(
      (code.match(/"id":"api-reference","label":"API Reference","level":1/g) ?? []).length,
    ).toBe(1)
    expect(code).toContain('import __docsRawApiDoc from "./api.json"')
    expect(code).toContain('DocsHeader as __DocsHeader')
    expect(code).toContain('DocsApiReference as __DocsApiReference')
    expect(code).not.toContain('return Markdown({ componentKey:')
    expect(code).not.toContain('apiReference:')
  })

  test('renders api slots as titled sections with slot-specific metadata tables', () => {
    const markdown = `
<DocsApiReference />
`

    const code = compileMarkdownPage(
      `
<DocsHeader apiDocOverride={{
  component: {
    key: 'command-palette',
    name: 'CommandPalette',
    category: 'Navigation',
    polymorphic: false
  },
  slots: [{ name: 'root' }, { name: 'item' }],
  props: { own: [], inherited: [] }
}} />

${markdown}
`,
      '/tmp/docs/pages/navigation/command-palette/command-palette.mdx',
    )

    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"slots": [{')
    expect(code).toContain('"name": "root"')
    expect(code).toContain('"name": "item"')
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
    expect(code).toContain('"name": "root"')
    expect(code).toContain('"description": "Root wrapper element."')
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

${API_REFERENCE_HEADING}

<DocsApiReference />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/form/custom/custom.mdx')
    expect(code).toContain('"id":"api-reference"')
    expect(code).toContain('"id":"attributes"')
    expect(code).toContain('"id":"api-items"')
    expect(code).toContain('"id":"api-inherited"')
    expect(code).toContain('"label":"Inherited"')
    expect(code).not.toContain('"id":"api-props"')
  })

  test('rejects removed Example component syntax', () => {
    const markdown = `
<Example name="Variants" source="./examples/button-variants.tsx" />
`

    expect(() =>
      compileMarkdownPage(markdown, '/tmp/docs/pages/general/button/button.mdx'),
    ).toThrow('<Example /> is no longer supported')
  })

  test('supports standalone mdx widget components', () => {
    const markdown = `
<IntroCards />
`

    const code = compileMarkdownPage(markdown, '/tmp/docs/pages/introduction.mdx')
    expect(code).toContain("from '../components/markdown'")
    expect(code).not.toContain('return Markdown({ componentKey:')
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
