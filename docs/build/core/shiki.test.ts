// @vitest-environment node

import { describe, expect, test } from 'vitest'

import {
  getDocsShikiCss,
  highlightCodeBlock,
  normalizeHighlightLanguage,
  parseCodeBlockMeta,
  parseCodeGroupId,
  parseCodeTitle,
  parseHighlightedLines,
  renderDocsCodeHtml,
} from './shiki.ts'

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
    expect([...parseHighlightedLines('{2}', [])]).toEqual([])
    expect([...parseHighlightedLines('{2}', '')]).toEqual([2])
    expect([...parseHighlightedLines(undefined, '{3-1, 2, invalid, 4-5}')]).toEqual([2, 4, 5])
    expect([...parseHighlightedLines(undefined, [2, Number.NaN, Infinity, 2])]).toEqual([2])
  })

  test('renders source code with dual themes and shiki classes', async () => {
    const html = await renderDocsCodeHtml({
      code: 'export const value = 1',
      language: 'tsx',
    })

    expect(html).toContain('class="shiki shiki-themes one-light one-dark-pro')
    expect(html).toContain('__shiki_')
    expect(getDocsShikiCss()).toContain('--shiki-light')
    expect(getDocsShikiCss()).toContain('--shiki-dark')
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

  test('renders pre tag with tabindex="-1" so codeblock does not receive tab focus', async () => {
    const html = await renderDocsCodeHtml({
      code: 'const a = 1',
      language: 'ts',
    })
    expect(html).toContain('tabindex="-1"')
    expect(html).not.toContain('tabindex="0"')
  })

  test('parses unified code block metadata', () => {
    const meta = parseCodeBlockMeta('title="example.tsx" group-id="tabs" {1,3-5} showLineNumbers')
    expect(meta).toEqual({
      title: 'example.tsx',
      groupId: 'tabs',
      highlightedLines: [1, 3, 4, 5],
      lineNumbers: true,
    })

    const withOverrides = parseCodeBlockMeta('title="custom.ts"', {
      highlightedLines: [2, 4],
      lineNumbers: true,
    })
    expect(withOverrides).toEqual({
      title: 'custom.ts',
      groupId: undefined,
      highlightedLines: [2, 4],
      lineNumbers: true,
    })
  })

  test('normalizes highlight languages and aliases', () => {
    expect(normalizeHighlightLanguage('pnpm')).toBe('bash')
    expect(normalizeHighlightLanguage('npm')).toBe('bash')
    expect(normalizeHighlightLanguage('yarn')).toBe('bash')
    expect(normalizeHighlightLanguage('bun')).toBe('bash')
    expect(normalizeHighlightLanguage('shell')).toBe('bash')
    expect(normalizeHighlightLanguage('sh')).toBe('bash')
    expect(normalizeHighlightLanguage('zsh')).toBe('bash')
    expect(normalizeHighlightLanguage('terminal')).toBe('bash')
    expect(normalizeHighlightLanguage('console')).toBe('bash')
    expect(normalizeHighlightLanguage('jsonc')).toBe('json')
    expect(normalizeHighlightLanguage('md')).toBe('markdown')
    expect(normalizeHighlightLanguage('js')).toBe('javascript')
    expect(normalizeHighlightLanguage('ts')).toBe('typescript')
    expect(normalizeHighlightLanguage('')).toBe('text')
    expect(normalizeHighlightLanguage(undefined)).toBe('text')
    expect(normalizeHighlightLanguage('python')).toBe('python')
  })

  test('highlights code block and returns structured result', async () => {
    const result = await highlightCodeBlock({
      code: 'pnpm add moraine',
      language: 'pnpm',
      meta: 'title="terminal" {1}',
    })

    expect(result.code).toBe('pnpm add moraine')
    expect(result.lang).toBe('bash')
    expect(result.title).toBe('terminal')
    expect(result.highlightedLines).toEqual([1])
    expect(result.lineNumbers).toBe(false)
    expect(result.html).toContain('class="line highlighted"')
    expect(result.html).toContain('moraine')
  })
})
