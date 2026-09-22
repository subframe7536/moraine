import { describe, expect, test } from 'vitest'

import { highlightApiTypes } from './highlight.ts'
import type { ComponentApi } from './types.ts'

describe('API type highlighting', () => {
  test.each([
    '(value: string | null) => void',
    '(string | {\n  /** Item label. */\n  label: string;\n})[]',
    'Array<{ value: "<script>" & string }>',
  ])('preserves the full type text: %s', async (type) => {
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
    expect(container.querySelector('code')?.textContent).toBe(type)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelectorAll('span').length).toBeGreaterThan(0)
    expect(html).toContain('--shiki-light')
    expect(html).toContain('--shiki-dark')
    expect(api.parts[0]!.props[0]).not.toHaveProperty('typeHtml')
    expect(result.parts[0]!.props[0]!.type).toBe('Item[]')
  })
})
