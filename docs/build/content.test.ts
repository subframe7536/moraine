// @vitest-environment node

import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'

import path from 'pathe'
import { expect, test } from 'vitest'

import { validateAnatomy } from './anatomy.ts'
import { loadComponentApiDoc } from './api-doc/load.ts'
import { collectMarkdownFiles } from './core/paths.ts'
import { resolvePreviewFile } from './markdown/previews.ts'

const execFileAsync = promisify(execFile)

const PAGES_ROOT = path.resolve(__dirname, '../pages/components')
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const CACHE_DIR = path.resolve(__dirname, '../node_modules/.cache/moraine/usage-check')
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

interface UsageSnippet {
  fileName: string
  page: string
  code: string
  startLine: number
}

function extractUsageSnippet(page: string, source: string): UsageSnippet | undefined {
  const code = usageExample(source)
  if (!code) {
    return undefined
  }
  const usage = usageSection(source)!
  const usageIndex = source.indexOf(usage)
  const fenceOffset = source.slice(usageIndex).indexOf('```tsx\n')
  const startLine = source.slice(0, usageIndex + fenceOffset + '```tsx\n'.length).split('\n').length

  return {
    fileName: `${path.basename(path.dirname(page))}.tsx`,
    page,
    code,
    startLine,
  }
}

test('copyable Usage examples compile against the public component API', async () => {
  mkdirSync(CACHE_DIR, { recursive: true })

  const snippets = new Map<string, UsageSnippet>()
  const validFiles = new Set<string>(['tsconfig.json', '.tsbuildinfo'])

  for (const page of componentPages()) {
    const source = readFileSync(page, 'utf8')
    const snippet = extractUsageSnippet(page, source)
    expect(snippet, `${page}: missing Usage example`).toBeTruthy()

    const targetFile = path.join(CACHE_DIR, snippet!.fileName)
    if (!existsSync(targetFile) || readFileSync(targetFile, 'utf8') !== snippet!.code) {
      writeFileSync(targetFile, snippet!.code)
    }

    snippets.set(snippet!.fileName, snippet!)
    validFiles.add(snippet!.fileName)
  }

  expect(snippets.size).toBeGreaterThan(0)

  for (const file of readdirSync(CACHE_DIR)) {
    if (!validFiles.has(file)) {
      rmSync(path.join(CACHE_DIR, file), { force: true })
    }
  }

  const configPath = path.join(CACHE_DIR, 'tsconfig.json')
  const configContent = JSON.stringify({
    extends: path.join(PROJECT_ROOT, 'tsconfig.json'),
    compilerOptions: {
      incremental: true,
      tsBuildInfoFile: path.join(CACHE_DIR, '.tsbuildinfo'),
      assumeChangesOnlyAffectDirectDependencies: true,
      paths: {
        moraine: [path.join(PROJECT_ROOT, 'src/index.ts')],
        'moraine/*': [path.join(PROJECT_ROOT, 'src/*')],
      },
    },
    files: Array.from(snippets.keys()),
    include: [],
    exclude: [],
  })

  if (!existsSync(configPath) || readFileSync(configPath, 'utf8') !== configContent) {
    writeFileSync(configPath, configContent)
  }

  const require = createRequire(import.meta.url)
  const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc')

  try {
    // Fence code is displayed to readers, so the MDX build alone cannot typecheck it.
    await execFileAsync(process.execPath, [compiler, '-p', configPath, '--pretty', 'false'], {
      encoding: 'utf8',
      timeout: 25_000,
    })
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    const rawOutput =
      (execError.stdout ?? '') + (execError.stderr ?? '') || execError.message || String(error)

    const remapped = rawOutput.replace(
      /(?:[\\/][^()]+[\\/])?([a-zA-Z0-9_-]+\.tsx)\((\d+),(\d+)\):/g,
      (match, fileName, line, col) => {
        const snippet = snippets.get(fileName)
        if (!snippet) {
          return match
        }
        const mdxLine = snippet.startLine + Number.parseInt(line, 10) - 1
        return `${path.relative(PROJECT_ROOT, snippet.page)}:${mdxLine}:${col}:`
      },
    )

    expect.fail(`Usage examples failed compilation:\n${remapped}`)
  }
}, 30_000)

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
    const ordered = ['Anatomy', 'Usage', 'Examples'].filter((section) => labels.includes(section))
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
    const anatomyIndex = source.search(/^## Anatomy$/m)
    const usageIndex = source.search(/^## Usage$/m)
    const firstSectionIndex = anatomyIndex >= 0 ? anatomyIndex : usageIndex
    if (playgroundIndex < 0) {
      failures.push(`${name}: missing Playground`)
    } else if (firstSectionIndex >= 0 && playgroundIndex > firstSectionIndex) {
      failures.push(`${name}: Playground follows ${anatomyIndex >= 0 ? 'Anatomy' : 'Usage'}`)
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
