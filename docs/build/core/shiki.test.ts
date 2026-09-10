// @vitest-environment node

import { describe, expect, test } from 'vitest'

import {
  getDocsHighlighter,
  parseCodeGroupId,
  parseCodeTitle,
  parseHighlightedLines,
  renderDocsCodeHtml,
} from './shiki'

describe('docs shiki code highlighter', () => {
  test('parses code group id from meta', () => {
    expect(parseCodeGroupId('title="bun" group-id="install"')).toBe('install')
    expect(parseCodeGroupId("group-id='install'")).toBe('install')
    expect(parseCodeGroupId('group-id=install')).toBe('install')
    expect(parseCodeGroupId('groupId="pkg"')).toBe('pkg')
    expect(parseCodeGroupId('group="pkg"')).toBe('pkg')
    expect(parseCodeGroupId('title="foo.tsx"')).toBeUndefined()
    expect(parseCodeGroupId('')).toBeUndefined()
  })

  test('parses code title and filename from meta', () => {
    expect(parseCodeTitle('title="button.tsx"')).toBe('button.tsx')
    expect(parseCodeTitle("title='button.tsx'")).toBe('button.tsx')
    expect(parseCodeTitle('filename="button.tsx"')).toBe('button.tsx')
    expect(parseCodeTitle('button.tsx {1,2}')).toBe('button.tsx')
    expect(parseCodeTitle('{1,2}')).toBeUndefined()
    expect(parseCodeTitle('')).toBeUndefined()
  })

  test('parses highlighted lines from meta and explicit parameter', () => {
    expect([...parseHighlightedLines('{1, 3-5}')]).toEqual([1, 3, 4, 5])
    expect([...parseHighlightedLines('title="foo.tsx" {2,4}')]).toEqual([2, 4])
    expect([...parseHighlightedLines(undefined, [1, 2, 5])]).toEqual([1, 2, 5])
    expect([...parseHighlightedLines(undefined, '1-3, 5')]).toEqual([1, 2, 3, 5])
    expect([...parseHighlightedLines(undefined, new Set([4]))]).toEqual([4])
  })

  test('renders source code with dual themes and shiki classes', async () => {
    const html = await renderDocsCodeHtml({
      code: 'export const value = 1',
      language: 'tsx',
    })

    expect(html).toContain('class="shiki shiki-themes one-light one-dark-pro"')
    expect(html).toContain('--shiki-light')
    expect(html).toContain('--shiki-dark')
    expect(html).toContain('export')
    expect(html).toContain('value')
  })

  test('renders highlighted lines with .highlighted class', async () => {
    const html = await renderDocsCodeHtml({
      code: 'const a = 1\nconst b = 2\nconst c = 3',
      language: 'tsx',
      highlightedLines: [2],
    })

    expect(html).toContain('class="line highlighted"')
  })

  test('renders line numbers with .line-numbers class on pre', async () => {
    const html = await renderDocsCodeHtml({
      code: 'const a = 1',
      language: 'tsx',
      lineNumbers: true,
    })

    expect(html).toContain('line-numbers')
  })

  test('falls back gracefully on unknown language', async () => {
    const html = await renderDocsCodeHtml({
      code: 'plain text content',
      language: 'unknown-lang-12345',
    })

    expect(html).toContain('plain text content')
    expect(html).toContain('shiki')
  })

  test('reuses singleton highlighter instance', async () => {
    const h1 = await getDocsHighlighter()
    const h2 = await getDocsHighlighter()
    expect(h1).toBe(h2)
  })
})
