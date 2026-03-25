import { readdir } from 'node:fs/promises'
import path from 'node:path'

import type { Plugin } from 'vite'

export interface DemoPageEntry {
  key: string
  group?: string
  importPath: string
}

const VIRTUAL_DEMO_PAGES = 'virtual:demo-pages'
const RESOLVED_VIRTUAL_DEMO_PAGES = '\0flint-ui-demo-pages'

function toPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

async function collectTsxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const sortedEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  const files: string[] = []

  for (const entry of sortedEntries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

function keyFromBaseName(baseName: string): string {
  return baseName.endsWith('-demos') ? baseName.slice(0, -'-demos'.length) : baseName
}

function compareByGroupAndPath(a: DemoPageEntry, b: DemoPageEntry): number {
  if (!a.group && b.group) {
    return -1
  }
  if (a.group && !b.group) {
    return 1
  }
  return a.importPath.localeCompare(b.importPath)
}

export async function scanDemoPages(projectRoot: string): Promise<DemoPageEntry[]> {
  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const files = await collectTsxFiles(pagesRoot)

  return files
    .map((filePath) => {
      const relativePath = toPosixPath(path.relative(pagesRoot, filePath))
      const importPath = `./pages/${relativePath.slice(0, -'.tsx'.length)}`
      const directory = path.dirname(relativePath)
      const group = directory === '.' ? undefined : toPosixPath(directory).split('/')[0]

      return Object.assign(
        { key: keyFromBaseName(path.basename(relativePath, `.tsx`)) },
        group ? { group } : {},
        { importPath },
      )
    })
    .sort(compareByGroupAndPath)
}

function toSingleQuoted(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function serializePage(page: Pick<DemoPageEntry, 'key' | 'group'>): string {
  if (!page.group) {
    return `  { key: ${toSingleQuoted(page.key)} },`
  }
  return `  { key: ${toSingleQuoted(page.key)}, group: ${toSingleQuoted(page.group)} },`
}

export function buildDemoPagesModuleCode(pages: DemoPageEntry[]): string {
  const demoMapCode = pages
    .map(
      (page) =>
        `  ${toSingleQuoted(page.key)}: lazy(() => import(${toSingleQuoted(page.importPath)})),`,
    )
    .join('\n')

  const pagesCode = pages.map((page) => serializePage(page)).join('\n')

  return [
    "import { lazy } from 'solid-js'",
    '',
    'export const demoMap = {',
    demoMapCode,
    '}',
    '',
    'export const pages = [',
    pagesCode,
    ']',
    '',
  ].join('\n')
}

export function demoPagesPlugin(): Plugin {
  let projectRoot = ''

  return {
    name: 'flint-ui-demo-pages',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = path.resolve(config.root, '..')
    },

    resolveId(id) {
      if (id === VIRTUAL_DEMO_PAGES) {
        return RESOLVED_VIRTUAL_DEMO_PAGES
      }
      return null
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_DEMO_PAGES) {
        return null
      }

      try {
        const pages = await scanDemoPages(projectRoot)
        return buildDemoPagesModuleCode(pages)
      } catch {
        console.warn('[demo-pages] failed to scan docs/pages, serving empty data')
        return 'export const demoMap = {}\nexport const pages = []\n'
      }
    },
  }
}
