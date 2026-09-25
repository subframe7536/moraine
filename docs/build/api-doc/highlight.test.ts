import { describe, expect, test } from 'vitest'

import { highlightApiTypes } from './highlight.ts'
import type { ComponentApi } from './types.ts'

describe('API type highlighting', () => {
  test.each([
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
    expect(html).toContain('--shiki-light')
    expect(html).toContain('--shiki-dark')
    expect(api.parts[0]!.props[0]).not.toHaveProperty('typeHtml')
    expect(result.parts[0]!.props[0]!.type).toBe('Item[]')
  })

  test('highlights the same optional callback type shown in the expanded row', async () => {
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
})
