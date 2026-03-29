import { readdir } from 'node:fs/promises'

import { loadApiDocIndex } from '../api-doc/load'
import { resolveDocsPageContext } from '../core/paths'
import { toSingleQuoted, toTitleCaseFromKey } from '../core/strings'

export interface ExamplePageEntry {
  key: string
  group?: string
  label: string
  importPath: string
}

export interface ExamplePageScanEntry {
  key: string
  group?: string
  importPath: string
}

const PAGE_LABEL_OVERRIDES = new Map<string, string>([['typescript', 'TypeScript']])

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const sortedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name))
  const files: string[] = []

  for (const entry of sortedEntries) {
    const fullPath = `${dir}/${entry.name}`
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
  left: Pick<ExamplePageScanEntry, 'group' | 'importPath'>,
  right: Pick<ExamplePageScanEntry, 'group' | 'importPath'>,
): number {
  if (!left.group && right.group) {
    return -1
  }
  if (left.group && !right.group) {
    return 1
  }
  return left.importPath.localeCompare(right.importPath)
}

export function buildExamplePageEntries(
  scannedPages: ExamplePageScanEntry[],
  componentNameMap: Map<string, string>,
): ExamplePageEntry[] {
  return scannedPages.map((page) =>
    Object.assign(
      {
        key: page.key,
        label:
          componentNameMap.get(page.key) ??
          PAGE_LABEL_OVERRIDES.get(page.key) ??
          toTitleCaseFromKey(page.key),
        importPath: page.importPath,
      },
      page.group ? { group: page.group } : {},
    ),
  )
}

export async function scanExamplePages(projectRoot: string): Promise<ExamplePageScanEntry[]> {
  const pagesRoot = `${projectRoot}/docs/pages`
  const files = await collectMarkdownFiles(pagesRoot)

  return files
    .map((filePath) => {
      const page = resolveDocsPageContext(filePath)
      return Object.assign(
        { key: page.pageKey, importPath: page.runtimeImportPath },
        page.group ? { group: page.group } : {},
      )
    })
    .sort(compareByGroupAndPath)
}

export function readComponentNameMap(projectRoot: string): Map<string, string> {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc) {
    return new Map()
  }

  return new Map(indexDoc.components.map((component) => [component.key, component.name]))
}

function serializePage(page: Pick<ExamplePageEntry, 'key' | 'group' | 'label'>): string {
  if (!page.group) {
    return `  { key: ${toSingleQuoted(page.key)}, label: ${toSingleQuoted(page.label)} },`
  }

  return `  { key: ${toSingleQuoted(page.key)}, group: ${toSingleQuoted(page.group)}, label: ${toSingleQuoted(page.label)} },`
}

export function buildExamplePagesModuleCode(pages: ExamplePageEntry[]): string {
  return [
    "import { lazy } from 'solid-js'",
    '',
    'export const exampleMap = {',
    ...pages.map(
      (page) =>
        `  ${toSingleQuoted(page.key)}: lazy(() => import(${toSingleQuoted(page.importPath)})),`,
    ),
    '}',
    '',
    'export const pages = [',
    ...pages.map((page) => serializePage(page)),
    ']',
    '',
  ].join('\n')
}
