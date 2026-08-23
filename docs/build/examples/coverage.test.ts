// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { collectFiles } from '../core/paths.ts'

import { resolveExampleFile } from '../markdown/examples.ts'

const PAGES_ROOT = path.resolve(process.cwd(), 'docs/pages')

function getComponentPageFiles(): string[] {
  const index = JSON.parse(
    readFileSync(path.join(PAGES_ROOT, '_api-index.json'), 'utf8'),
  ) as { components: { key: string }[] }
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

function getExamplePaths(source: string): string[] {
  return [...source.matchAll(/<Example\b[\s\S]*?\bpath="([^"]+)"[\s\S]*?\/>/g)].flatMap(
    (match) => (match[1] ? [match[1]] : []),
  )
}

describe('component documentation example coverage', () => {
  test('keeps every generated component page covered by safe, configurable examples', () => {
    const pages = getComponentPageFiles()
    const allReferences: string[] = []

    expect(pages).toHaveLength(42)

    for (const page of pages) {
      const source = readFileSync(page, 'utf8')
      const examples = getExamplePaths(source)
      const playgrounds = [...source.matchAll(/<Example\b(?=[^>]*\bplayground\b)(?=[^>]*\bcontrols=\{\[)[^>]*>/g)]

      expect(source, page).toContain('## Examples')
      expect(playgrounds, page).toHaveLength(1)
      expect(examples.length, page).toBeGreaterThanOrEqual(3)
      expect(new Set(examples).size, page).toBeGreaterThanOrEqual(3)

      for (const examplePath of examples) {
        expect(() => resolveExampleFile(page, examplePath)).not.toThrow()
      }

      allReferences.push(...examples.map((examplePath) => `${page}:${examplePath}`))
    }

    expect(allReferences.length).toBeGreaterThan(186)
  })
})
