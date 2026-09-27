// @vitest-environment node

import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildLlmsDocuments } from './llms.ts'
import { DOCS_SITE } from './site-meta.ts'

const projectRoot = path.resolve(__dirname, '../..')
let documentPromise: ReturnType<typeof buildLlmsDocuments> | undefined
function documents() {
  return (documentPromise ??= buildLlmsDocuments({ projectRoot, ...DOCS_SITE }))
}

describe('agent Markdown', () => {
  test('mirrors canonical URLs and separates the two navigation spaces', async () => {
    const result = await documents()
    const names = new Set(result.map((item) => item.fileName))
    for (const name of [
      'docs/getting-started.md',
      'docs/installation.md',
      'docs/styling/design.md',
      'docs/composition.md',
      'docs/reference/typescript.md',
      'components.md',
      'components/button.md',
    ]) {
      expect(names.has(name)).toBe(true)
    }
    for (const old of ['start.md', 'button.md', 'styling/design.md']) {
      expect(names.has(old)).toBe(false)
    }
    const index = result.find((item) => item.fileName === 'llms.txt')!.source
    expect(index).toContain('## Docs')
    expect(index).toContain('## Components')
    expect(index).toContain('https://ui.subf.dev/docs/getting-started.md')
    expect(index).toContain('https://ui.subf.dev/components/button.md')
  })

  test('removes build metadata, runtime imports, Playground and MDX from every generated document', async () => {
    for (const { fileName, source } of await documents()) {
      if (fileName === 'llms.txt') {
        continue
      }
      expect(source, fileName).not.toMatch(/^---/)
      expect(source, fileName).not.toContain("from '@src'")
      expect(source, fileName).not.toContain('## Playground')
      expect(source, fileName).not.toMatch(/<Preview\b|<ComponentsIndex\b|<CodeTabs\b/)
    }
  })

  test('expands the component directory and preserves component API sections', async () => {
    const result = await documents()
    const directory = result.find((item) => item.fileName === 'components.md')!.source
    expect(directory).toContain('## General')
    expect(directory).toContain('## Overlay')
    expect(directory).toContain(
      '[Button](https://ui.subf.dev/components/button.md): Render actions',
    )
    const button = result.find((item) => item.fileName === 'components/button.md')!.source
    expect(button).toContain('## Basic usage')
    expect(button).toContain("import { Button } from 'moraine'")
    expect(button).toContain('## Anatomy')
    expect(button).toContain('## Usage')
    expect(button).toContain('## Props')
    const select = result.find((item) => item.fileName === 'components/select.md')!.source
    expect(select).toContain('https://ui.subf.dev/components/combobox.md')
    const customization = result.find(
      (item) => item.fileName === 'docs/styling/customization.md',
    )!.source
    expect(customization).toContain('https://ui.subf.dev/docs/composition.md')
  })
})
