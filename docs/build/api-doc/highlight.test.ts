// @vitest-environment node
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { highlightApiTypes, renderDescriptionHtml } from './highlight.ts'
import type { ComponentApi } from './types.ts'
// The highlighter loads Shiki's WASM through `Blob.stream()`, which jsdom's global `Blob` lacks, so
// this file runs in the Node environment and builds its own document for markup assertions.
const { document } = new JSDOM('').window

describe('aPI type highlighting', () => {
  it.each([
    ['(value: string | null) => void', '((value: string | null) => void) | undefined'],
    [
      '(string | {\n  /** Item label. */\n  label: string;\n})[]',
      '(string | {\n  /** Item label. */\n  label: string;\n})[] | undefined',
    ],
    ['Array<{ value: "<script>" & string }>', 'Array<{ value: "<script>" & string }> | undefined'],
  ])('preserves the full type text: %s', async (type, expected) => {
    const api: ComponentApi = {
      key: 'test',
      name: 'Test',
      kind: 'single',
      slots: [],
      dataAttributes: [],
      parts: [
        {
          id: 'test',
          name: 'Test',
          access: { kind: 'export', name: 'Test' },
          props: [{ name: 'items', optional: true, type: 'Item[]', typeDetails: type }],
        },
      ],
    }
    const result = await highlightApiTypes(api)
    const html = result.parts[0]!.props[0]!.typeHtml!
    const container = document.createElement('div')
    container.innerHTML = html
    expect(container.querySelector('code')?.textContent).toBe(expected)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelectorAll('span').length).toBeGreaterThan(0)
    expect(html).toContain('__shiki_')
    expect(api.parts[0]!.props[0]).not.toHaveProperty('typeHtml')
    expect(result.parts[0]!.props[0]!.type).toBe('Item[]')
  })

  it('highlights the same optional callback type shown in the expanded row', async () => {
    const api: ComponentApi = {
      key: 'test',
      name: 'Test',
      kind: 'single',
      slots: [],
      dataAttributes: [],
      parts: [
        {
          id: 'test',
          name: 'Test',
          access: { kind: 'export', name: 'Test' },
          props: [{ name: 'onChange', optional: true, type: '() => string | undefined' }],
        },
      ],
    }
    const result = await highlightApiTypes(api)
    const container = document.createElement('div')
    container.innerHTML = result.parts[0]!.props[0]!.typeHtml!
    expect(container.querySelector('code')?.textContent).toBe(
      '(() => string | undefined) | undefined',
    )
    expect(api.parts[0]!.props[0]).not.toHaveProperty('typeHtml')
  })

  it('renders prop descriptions as markdown and examples as highlighted code', async () => {
    const api: ComponentApi = {
      key: 'test',
      name: 'Test',
      kind: 'single',
      slots: [],
      dataAttributes: [],
      parts: [
        {
          id: 'test',
          name: 'Test',
          access: { kind: 'export', name: 'Test' },
          props: [
            {
              name: 'formatOptions',
              optional: true,
              type: 'Intl.NumberFormatOptions',
              description: '`Intl.NumberFormat` options, see **notes**.',
              examples: ['<Test formatOptions={{ style: "percent" }} />'],
            },
          ],
        },
      ],
    }
    const result = await highlightApiTypes(api)
    const prop = result.parts[0]!.props[0]!
    expect(prop.descriptionHtml).toBe(
      '<p><code class="docs-inline-code">Intl.NumberFormat</code> options, see <strong>notes</strong>.</p>',
    )
    const container = document.createElement('div')
    container.innerHTML = prop.examplesHtml![0]!
    expect(container.querySelector('code')?.textContent).toBe(
      '<Test formatOptions={{ style: "percent" }} />',
    )
    expect(api.parts[0]!.props[0]).not.toHaveProperty('descriptionHtml')
    expect(api.parts[0]!.props[0]).not.toHaveProperty('examplesHtml')
  })

  it('escapes raw HTML in prose but keeps code spans', async () => {
    const html = renderDescriptionHtml('Renders <script>alert(1)</script> or `<div>`.')
    const container = document.createElement('div')
    container.innerHTML = html
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('code')?.textContent).toBe('<div>')
    expect(container.textContent).toContain('<script>alert(1)</script>')
  })
})
