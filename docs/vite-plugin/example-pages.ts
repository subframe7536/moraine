import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

import type { Plugin } from 'vite'

export interface ExamplePageEntry {
  key: string
  group?: string
  label: string
  importPath: string
}

const VIRTUAL_EXAMPLE_PAGES = 'virtual:example-pages'
const RESOLVED_VIRTUAL_EXAMPLE_PAGES = '\0moraine-example-pages'

function toPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const sortedEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  const files: string[] = []

  for (const entry of sortedEntries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function compareByGroupAndPath(
  a: Pick<ExamplePageScanEntry, 'group' | 'importPath'>,
  b: Pick<ExamplePageScanEntry, 'group' | 'importPath'>,
): number {
  if (!a.group && b.group) {
    return -1
  }
  if (a.group && !b.group) {
    return 1
  }
  return a.importPath.localeCompare(b.importPath)
}

function derivePageKey(relativePath: string): string {
  const fileBaseName = path.basename(relativePath, '.md')
  const parentDirectory = path.basename(path.dirname(relativePath))
  return parentDirectory === fileBaseName ? parentDirectory : fileBaseName
}

export interface ExamplePageScanEntry {
  key: string
  group?: string
  importPath: string
}

function toTitleCaseFromKey(key: string): string {
  return key
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function readComponentNameMap(projectRoot: string): Map<string, string> {
  const apiDocPath = path.join(projectRoot, 'docs/api-doc/index.json')

  try {
    const content = readFileSync(apiDocPath, 'utf8')
    const parsed = JSON.parse(content) as {
      components?: Array<{ key?: string; name?: string }>
    }

    return new Map(
      (parsed.components ?? [])
        .filter((entry): entry is { key: string; name: string } => Boolean(entry.key && entry.name))
        .map((entry) => [entry.key, entry.name]),
    )
  } catch {
    return new Map()
  }
}

export function buildExamplePageEntries(
  scannedPages: ExamplePageScanEntry[],
  componentNameMap: Map<string, string>,
): ExamplePageEntry[] {
  return scannedPages.map((page) =>
    Object.assign(
      {
        key: page.key,
        label: componentNameMap.get(page.key) ?? toTitleCaseFromKey(page.key),
        importPath: page.importPath,
      },
      page.group ? { group: page.group } : {},
    ),
  )
}

export async function scanExamplePages(projectRoot: string): Promise<ExamplePageScanEntry[]> {
  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const files = await collectMarkdownFiles(pagesRoot)

  return files
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(pagesRoot, filePath))
      const importPath = `./pages/${relativePath}`
      const directory = path.dirname(relativePath)
      const group = directory === '.' ? undefined : toPosixPath(directory).split('/')[0]

      return Object.assign({ key: derivePageKey(relativePath) }, group ? { group } : {}, {
        importPath,
      })
    })
    .sort(compareByGroupAndPath)
}

function toSingleQuoted(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function serializePage(page: Pick<ExamplePageEntry, 'key' | 'group' | 'label'>): string {
  if (!page.group) {
    return `  { key: ${toSingleQuoted(page.key)}, label: ${toSingleQuoted(page.label)} },`
  }
  return `  { key: ${toSingleQuoted(page.key)}, group: ${toSingleQuoted(page.group)}, label: ${toSingleQuoted(page.label)} },`
}

export function buildExamplePagesModuleCode(pages: ExamplePageEntry[]): string {
  const mapCode = pages
    .map(
      (page) =>
        `  ${toSingleQuoted(page.key)}: lazy(() => import(${toSingleQuoted(page.importPath)})),`,
    )
    .join('\n')

  const pagesCode = pages.map((page) => serializePage(page)).join('\n')

  return [
    "import { lazy } from 'solid-js'",
    '',
    'export const exampleMap = {',
    mapCode,
    '}',
    '',
    'export const pages = [',
    pagesCode,
    ']',
    '',
  ].join('\n')
}

export function examplePagesPlugin(): Plugin {
  let projectRoot = ''

  return {
    name: 'moraine-example-pages',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = path.resolve(config.root, '..')
    },

    resolveId(id) {
      if (id === VIRTUAL_EXAMPLE_PAGES) {
        return RESOLVED_VIRTUAL_EXAMPLE_PAGES
      }
      return null
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_EXAMPLE_PAGES) {
        return null
      }

      try {
        const scannedPages = await scanExamplePages(projectRoot)
        const pages = buildExamplePageEntries(scannedPages, readComponentNameMap(projectRoot))
        return buildExamplePagesModuleCode(pages)
      } catch {
        console.warn('[example-pages] failed to scan docs/pages, serving empty data')
        return 'export const exampleMap = {}\nexport const pages = []\n'
      }
    },
  }
}
