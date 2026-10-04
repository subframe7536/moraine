// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { expect, test } from 'vitest'

import { validateAnatomy } from './anatomy.ts'
import { loadComponentApiDoc } from './api-doc/load.ts'
import { collectMarkdownFiles } from './core/paths.ts'
import { resolvePreviewFile } from './markdown/previews.ts'

const PAGES_ROOT = path.resolve(__dirname, '../pages/components')
const PROJECT_ROOT = path.resolve(__dirname, '../..')

function componentPages(): string[] {
  return collectMarkdownFiles(PAGES_ROOT).filter(
    (file) => file.endsWith('/index.mdx') && file !== path.join(PAGES_ROOT, 'index.mdx'),
  )
}

test('copyable Basic usage examples compile against the public component API', () => {
  const directory = mkdtempSync(path.join(PROJECT_ROOT, 'docs/.content-check-'))
  try {
    for (const page of componentPages()) {
      const source = readFileSync(page, 'utf8')
      const basic = source.match(/^## Basic usage\n+```tsx\n([\s\S]*?)\n```/m)
      expect(basic, `${page}: missing Basic usage example`).not.toBeNull()
      writeFileSync(path.join(directory, `${path.basename(path.dirname(page))}.tsx`), basic![1]!)
    }
    const config = path.join(directory, 'tsconfig.json')
    writeFileSync(
      config,
      JSON.stringify({
        extends: path.join(PROJECT_ROOT, 'tsconfig.json'),
        compilerOptions: {
          paths: {
            moraine: [path.join(PROJECT_ROOT, 'src/index.ts')],
            'moraine/*': [path.join(PROJECT_ROOT, 'src/*')],
          },
        },
        include: ['*.tsx'],
        exclude: [],
      }),
    )
    const require = createRequire(import.meta.url)
    const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc')
    // Fence code is displayed to readers, so the MDX build alone cannot typecheck it.
    const result = spawnSync(process.execPath, [compiler, '-p', config, '--pretty', 'false'], {
      encoding: 'utf8',
      timeout: 20_000,
      stdio: 'pipe',
    })
    expect(result.status, result.stdout + result.stderr).toBe(0)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 25_000)

test('component pages follow the shared content and anatomy contract', async () => {
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
    const required = ['Basic usage', 'Playground', 'Usage']
    for (const section of required) {
      if (!labels.includes(section)) {
        failures.push(`${name}: missing ${section}`)
      }
    }
    const ordered = ['Basic usage', 'Playground', 'Anatomy', 'Usage'].filter((section) =>
      labels.includes(section),
    )
    if (
      ordered.some(
        (section, index) =>
          index > 0 && labels.indexOf(section) < labels.indexOf(ordered[index - 1]),
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
      await validateAnatomy(source, page, loadComponentApiDoc(page) ?? undefined)
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
