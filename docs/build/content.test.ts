// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from 'vitest'

import { resolvePreviewFile } from './markdown/previews.ts'

const PAGES_ROOT = path.resolve(__dirname, '../pages')

function componentPages(): string[] {
  return readdirSync(PAGES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\(.+\)$/.test(entry.name))
    .flatMap((group) =>
      readdirSync(path.join(PAGES_ROOT, group.name), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(PAGES_ROOT, group.name, entry.name, 'index.mdx')),
    )
}

test('component pages keep anatomy, guidance, and a resolvable copy-ready preview', () => {
  const failures: string[] = []

  for (const page of componentPages()) {
    const source = readFileSync(page, 'utf8')
    const name = path.relative(PAGES_ROOT, page)
    const sections = [...source.matchAll(/^## (.+)$/gm)]
    const anatomy = sections.find((match) => match[1] === 'Anatomy')
    const usage = sections.find((match) => match[1] === 'Usage')
    const examples = sections.find((match) => match[1] === 'Examples')

    if (sections.some((match) => match[1] === 'Features')) {
      failures.push(`${name}: Features`)
    }
    if (!anatomy) {
      failures.push(`${name}: missing Anatomy`)
    }
    if (!usage) {
      failures.push(`${name}: missing Usage`)
    }

    const previewStart = usage?.index ?? examples?.index
    const previews =
      previewStart === undefined
        ? []
        : [...source.slice(previewStart).matchAll(/<Preview\s+path="([^"]+)"\s*\/>/g)]
    if (previews.length === 0) {
      failures.push(`${name}: missing Usage/Examples Preview`)
    }
    for (const preview of previews) {
      try {
        resolvePreviewFile(page, preview[1]!)
      } catch (error) {
        failures.push(`${name}: ${String(error)}`)
      }
    }
  }

  expect(failures).toEqual([])
})
