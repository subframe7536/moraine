// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from 'vitest'

import { validateAnatomy } from './anatomy.ts'
import { loadComponentApiDoc } from './api-doc/load.ts'
import { collectMarkdownFiles } from './core/paths.ts'
import { resolvePreviewFile } from './markdown/previews.ts'

const PAGES_ROOT = path.resolve(__dirname, '../pages/components')

function componentPages(): string[] {
  return collectMarkdownFiles(PAGES_ROOT).filter(
    (file) => file.endsWith('/index.mdx') && file !== path.join(PAGES_ROOT, 'index.mdx'),
  )
}

test('component pages follow the shared content and anatomy contract', () => {
  const failures: string[] = []
  for (const page of componentPages()) {
    const source = readFileSync(page, 'utf8')
    const name = path.relative(PAGES_ROOT, page)
    const sections = [...source.matchAll(/^## (.+)$/gm)]
    const labels = sections.map((match) => match[1])
    const intro = source
      .slice(source.indexOf('\n---', 3) + 4, sections[0]?.index)
      .replace(/^import .*$/gm, '')
      .trim()
    if (!intro || intro.startsWith('##')) {
      failures.push(`${name}: missing introduction`)
    }
    const required = ['Basic usage', 'Playground', 'Anatomy', 'Usage']
    for (const section of required) {
      if (!labels.includes(section)) {
        failures.push(`${name}: missing ${section}`)
      }
    }
    if (
      required.some(
        (section, index) =>
          index > 0 && labels.indexOf(section) < labels.indexOf(required[index - 1]),
      )
    ) {
      failures.push(`${name}: incorrect section order`)
    }
    if (labels.includes('Examples') && labels.indexOf('Examples') < labels.indexOf('Usage')) {
      failures.push(`${name}: Examples precedes Usage`)
    }
    for (const section of ['Import', 'Features', 'Related', 'Related components']) {
      if (labels.includes(section)) {
        failures.push(`${name}: forbidden ${section}`)
      }
    }
    const basic = source.match(/^## Basic usage\n+```tsx\n([\s\S]*?)\n```/m)
    if (
      !basic ||
      !/from ['"]moraine(?:\/[\w-]+)?['"]/.test(basic[1]!) ||
      basic[1]!.includes('@src')
    ) {
      failures.push(`${name}: Basic usage needs one public TSX example`)
    }
    const playground = sections.find((section) => section[1] === 'Playground')
    const basicSection = source.slice(
      sections.find((section) => section[1] === 'Basic usage')?.index ?? 0,
      playground?.index,
    )
    if ([...basicSection.matchAll(/^```tsx$/gm)].length !== 1) {
      failures.push(`${name}: Basic usage must have exactly one TSX fence`)
    }
    if (basic && playground && source.indexOf(basic[0]) > playground.index) {
      failures.push(`${name}: Basic usage follows Playground`)
    }
    try {
      validateAnatomy(
        source,
        path.basename(path.dirname(page)),
        page,
        loadComponentApiDoc(page) ?? undefined,
      )
    } catch (error) {
      failures.push(String(error))
    }
    for (const preview of source.matchAll(/<Preview\s+path="([^"]+)"\s*\/>/g)) {
      try {
        resolvePreviewFile(page, preview[1]!)
      } catch (error) {
        failures.push(`${name}: ${String(error)}`)
      }
    }
  }
  expect(failures).toEqual([])
})

test('anatomy validator rejects unknown parts and slots while allowing internal nodes and no-DOM roots', () => {
  const source = (node: string) =>
    `## Anatomy\n\n\`\`\`text\nDialog [component; no DOM]\n└── ${node}\n\`\`\``
  const api = { slots: ['content'], parts: [{ name: 'Dialog.Content' }] } as Parameters<
    typeof validateAnatomy
  >[3]
  expect(() =>
    validateAnatomy(source('Dialog.Content [part; slot=content]'), 'Dialog', 'dialog.mdx', api),
  ).not.toThrow()
  expect(() =>
    validateAnatomy(source('wrapper [internal]'), 'Dialog', 'dialog.mdx', api),
  ).not.toThrow()
  expect(() => validateAnatomy(source('Dialog.Fake [part]'), 'Dialog', 'dialog.mdx', api)).toThrow(
    'unknown part Dialog.Fake',
  )
  expect(() => validateAnatomy(source('fake [slot]'), 'Dialog', 'dialog.mdx', api)).toThrow(
    'unknown slot fake',
  )
})
