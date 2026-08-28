// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { collectFiles } from '../core/paths.ts'
import { resolvePreviewFile } from '../markdown/previews.ts'

const PAGES_ROOT = path.resolve(process.cwd(), 'docs/pages')

function getComponentPageFiles(): string[] {
  const index = JSON.parse(readFileSync(path.join(PAGES_ROOT, '_api-index.json'), 'utf8')) as {
    components: { key: string }[]
  }
  const pagesByKey = new Map(
    collectFiles(PAGES_ROOT, (file) => path.basename(file) === 'index.mdx')
      .filter((file) => file !== path.join(PAGES_ROOT, 'index.mdx'))
      .map((file) => [path.basename(path.dirname(file)), file]),
  )

  const generatedPages = index.components.map(({ key }) => {
    const page = pagesByKey.get(key)
    if (!page) {
      throw new Error(`missing component page for ${key}`)
    }
    return page
  })

  const componentPages = collectFiles(PAGES_ROOT, (file) => path.basename(file) === 'index.mdx')
    .filter((file) => file !== path.join(PAGES_ROOT, 'index.mdx'))
    .sort()

  expect(componentPages).toEqual(expect.arrayContaining(generatedPages))
  return componentPages
}

function getPreviewPaths(source: string): string[] {
  return [...source.matchAll(/<Preview\b[\s\S]*?\bpath="([^"]+)"[\s\S]*?\/>/g)].flatMap((match) =>
    match[1] ? [match[1]] : [],
  )
}

describe('component documentation preview coverage', () => {
  test('keeps every generated component page covered by safe, configurable previews', () => {
    const pages = getComponentPageFiles()
    const allReferences: string[] = []

    expect(pages).toHaveLength(42)

    for (const page of pages) {
      const source = readFileSync(page, 'utf8')
      const previews = getPreviewPaths(source)
      const playgrounds = [
        ...source.matchAll(
          /<Playground\b(?=[^>]*\bcontrols=\{\[)[\s\S]*?\{\(props\)\s*=>[\s\S]*?<\/Playground>/g,
        ),
      ]

      expect(source, page).toContain('## Usage')
      expect(source, page).toContain('## Examples')
      expect(playgrounds, page).toHaveLength(1)
      const importIndex = source.indexOf('\n## Import')
      const playgroundIndex = source.indexOf('\n## Playground')
      const usageIndex = source.indexOf('\n## Usage')
      const examplesIndex = source.indexOf('\n## Examples')
      expect(importIndex, page).toBeGreaterThanOrEqual(0)
      expect(playgroundIndex, page).toBeGreaterThan(importIndex)
      expect(usageIndex, page).toBeGreaterThan(playgroundIndex)
      expect(examplesIndex, page).toBeGreaterThan(usageIndex)
      expect(source.match(/^## Playground\s*$/gm), page).toHaveLength(1)
      expect(source).not.toContain('### Playground')
      expect(source, page).not.toContain('path="./playground"')
      // Usage and Examples sections provide interactive guides and copy-ready scenarios.
      expect(previews.length, page).toBeGreaterThanOrEqual(1)
      expect(new Set(previews).size, page).toBe(previews.length)

      for (const previewPath of previews) {
        expect(() => resolvePreviewFile(page, previewPath)).not.toThrow()
      }

      allReferences.push(...previews.map((previewPath) => `${page}:${previewPath}`))
    }

    expect(allReferences.length).toBeGreaterThanOrEqual(pages.length)
    expect(collectFiles(PAGES_ROOT, (file) => path.basename(file) === 'playground.tsx')).toEqual([])
  })
})
