// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import path from 'pathe'
import { expect, test } from 'vitest'

import { validateAnatomy } from './anatomy.ts'
import { loadComponentApiDoc } from './api-doc/load.ts'
import { collectMarkdownFiles } from './core/paths.ts'
import { resolvePreviewFile } from './markdown/previews.ts'

const PAGES_ROOT = path.resolve(__dirname, '../pages/components')
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const ALLOWED_HEADINGS = new Set(['Usage', 'Anatomy', 'Examples'])

function componentPages(): string[] {
  return collectMarkdownFiles(PAGES_ROOT).filter(
    (file) => file.endsWith('/index.mdx') && file !== path.join(PAGES_ROOT, 'index.mdx'),
  )
}

function sectionByName(source: string, name: string): string | undefined {
  const matches = [...source.matchAll(/^## (.+)$/gm)]
  const index = matches.findIndex((match) => match[1] === name)
  if (index < 0) {
    return undefined
  }
  const start = matches[index]!.index + matches[index]![0].length
  const end = matches[index + 1]?.index ?? source.length
  return source.slice(start, end)
}

function usageSection(source: string): string | undefined {
  return sectionByName(source, 'Usage')
}

function usageExample(source: string): string | undefined {
  const usage = usageSection(source)
  if (!usage) {
    return undefined
  }
  const beforeSubsection = usage.split(/^### /m)[0] ?? usage
  return beforeSubsection.match(/```tsx\n([\s\S]*?)\n```/)?.[1]
}

test('copyable Usage examples compile against the public component API', () => {
  const directory = mkdtempSync(path.join(PROJECT_ROOT, 'docs/.content-check-'))
  try {
    const examples: string[] = []
    for (const page of componentPages()) {
      const source = readFileSync(page, 'utf8')
      const basic = usageExample(source)
      expect(basic, `${page}: missing Usage example`).toBeTruthy()
      const fileName = `${path.basename(path.dirname(page))}.tsx`
      writeFileSync(path.join(directory, fileName), basic!)
      examples.push(fileName)
    }
    expect(examples.length).toBeGreaterThan(0)
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
        files: examples,
        include: [],
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
    const labels = sections
      .map((match) => match[1])
      .filter((label): label is string => Boolean(label))
    if (!labels.includes('Usage')) {
      failures.push(`${name}: missing Usage`)
    }
    if (!labels.includes('Examples')) {
      failures.push(`${name}: missing Examples`)
    }
    const ordered = ['Usage', 'Anatomy', 'Examples'].filter((section) => labels.includes(section))
    if (
      ordered.some((section, index) => {
        const previous = ordered[index - 1]
        return (
          index > 0 && previous !== undefined && labels.indexOf(section) < labels.indexOf(previous)
        )
      })
    ) {
      failures.push(`${name}: incorrect section order`)
    }
    for (const section of labels) {
      if (!ALLOWED_HEADINGS.has(section)) {
        failures.push(`${name}: forbidden ${section}`)
      }
    }
    const playgroundIndex = source.indexOf('<Playground')
    const usageIndex = source.search(/^## Usage$/m)
    if (playgroundIndex < 0) {
      failures.push(`${name}: missing Playground`)
    } else if (usageIndex >= 0 && playgroundIndex > usageIndex) {
      failures.push(`${name}: Playground follows Usage`)
    }
    const usage = usageSection(source)
    if (usage?.includes('<Preview')) {
      failures.push(`${name}: Usage contains Preview`)
    }
    const usageLead = usage?.split(/```tsx/)[0]?.trim() ?? ''
    if (!usageLead) {
      failures.push(`${name}: missing introduction`)
    }
    const basic = usageExample(source)
    if (!basic || !/from ['"]moraine(?:\/[\w-]+)?['"]/.test(basic) || basic.includes('@src')) {
      failures.push(`${name}: Usage needs one public TSX example`)
    }
    const usageLeadFences = usage?.split(/^### /m)[0] ?? ''
    if ([...usageLeadFences.matchAll(/^```tsx$/gm)].length !== 1) {
      failures.push(`${name}: Usage lead must have exactly one TSX fence`)
    }
    const examples = sectionByName(source, 'Examples')
    if (examples && ![...examples.matchAll(/<Preview\s+path="([^"]+)"\s*\/>/g)].length) {
      failures.push(`${name}: Examples needs at least one Preview`)
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
