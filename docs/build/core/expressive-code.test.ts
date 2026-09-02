// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { getDocsExpressiveCodeAssets, renderDocsCodeHtml } from './expressive-code'

describe('docs expressive code renderer', () => {
  test('renders source code with frames, copy support and line numbers', async () => {
    const html = await renderDocsCodeHtml({
      code: 'export const value = 1',
      language: 'tsx',
      props: { frame: 'code', title: 'example.tsx', showLineNumbers: true },
    })

    expect(html).toContain('expressive-code')
    expect(html).toContain('example.tsx')
    expect(html).toContain('class="ln"')
    expect(html).toContain('data-code=')
  })

  test('hides line numbers for regular source blocks by default', async () => {
    const html = await renderDocsCodeHtml({
      code: 'export const value = 1',
      language: 'tsx',
    })

    expect(html).not.toContain('class="ln"')
  })

  test('renders preview source with a sticky copy control and no header', async () => {
    const html = await renderDocsCodeHtml({
      code: 'export const value = 1',
      language: 'tsx',
      stickyCopyButton: true,
      props: { frame: 'none', showLineNumbers: true },
    })

    expect(html).toContain('class="docs-code-copy-toolbar"')
    expect(html).toMatch(/class="docs-code-copy-toolbar">.*class="copy"/s)
    expect(html).not.toContain('<figcaption')
    expect(html).toContain('class="ln"')
  })

  test.each(['bash', 'text'])('hides line numbers for %s blocks', async (language) => {
    const html = await renderDocsCodeHtml({ code: 'example', language })

    expect(html).not.toContain('class="ln"')
  })

  test('allows metadata to override line numbers and add annotations', async () => {
    const html = await renderDocsCodeHtml({
      code: 'const value = 1',
      language: 'tsx',
      meta: 'showLineNumbers=false title="value.ts" ins={1} wrap',
    })

    expect(html).toContain('value.ts')
    expect(html).toContain('highlight ins')
    expect(html).not.toContain('class="ln"')
  })

  test('exposes global light and dark theme assets', async () => {
    const assets = await getDocsExpressiveCodeAssets()

    expect(assets.css).toContain(':root')
    expect(assets.css).toContain(':root.dark')
    expect(assets.css).toContain('--ec-brdCol:var(--border)')
    expect(assets.css).toContain('--ec-frm-frameBoxShdCssVal:0 1px 2px rgb(0 0 0 / 0.04)')
    expect(assets.css).toContain('--ec-codePadBlk:0.875rem')
    expect(assets.css).toContain('--ec-frm-inlBtnBrd:var(--border)')
    expect(assets.css).toContain('M4%2016c-1.1')
    expect(assets.css).not.toContain('prefers-color-scheme')
    expect(assets.js).toContain('MutationObserver')
  })
})
