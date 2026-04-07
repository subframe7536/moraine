import { readFile, readdir } from 'node:fs/promises'

import { loadApiDocIndex } from '../api-doc/load'
import { resolveDocsPageContext } from '../core/paths'
import { toSingleQuoted, toTitleCaseFromKey } from '../core/strings'
import { parseSegments } from '../markdown/directives'

export type ExamplePageStatus = 'new' | 'update' | 'unreleased'

const EXAMPLE_PAGE_STATUS_ALIASES = new Map<string, ExamplePageStatus>([
  ['new', 'new'],
  ['update', 'update'],
  ['unreleased', 'unreleased'],
  ['unrelease', 'unreleased'],
])

const DOCS_HEADER_ALIAS_MAP = new Map<string, string>([['header', 'docs-header']])

export interface ExamplePageEntry {
  key: string
  group?: string
  label: string
  status?: ExamplePageStatus
  importPath: string
}

export interface ExamplePageScanEntry {
  key: string
  group?: string
  status?: ExamplePageStatus
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

function normalizeExamplePageStatus(value: unknown): ExamplePageStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return EXAMPLE_PAGE_STATUS_ALIASES.get(value.trim().toLowerCase())
}

function extractExamplePageStatus(markdown: string, id: string): ExamplePageStatus | undefined {
  try {
    const segments = parseSegments(markdown, id, { directiveAliases: DOCS_HEADER_ALIAS_MAP })

    for (const segment of segments) {
      if (segment.type !== 'docs-header') {
        continue
      }

      return normalizeExamplePageStatus(segment.props?.status)
    }
  } catch {
    return undefined
  }

  return undefined
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
      page.status ? { status: page.status } : {},
    ),
  )
}

export async function scanExamplePages(projectRoot: string): Promise<ExamplePageScanEntry[]> {
  const pagesRoot = `${projectRoot}/docs/pages`
  const files = await collectMarkdownFiles(pagesRoot)

  const scannedPages = await Promise.all(
    files.map(async (filePath) => {
      const page = resolveDocsPageContext(filePath)
      const markdown = await readFile(filePath, 'utf8')
      const status = extractExamplePageStatus(markdown, filePath)

      return Object.assign(
        { key: page.pageKey, importPath: page.runtimeImportPath },
        page.group ? { group: page.group } : {},
        status ? { status } : {},
      )
    }),
  )

  return scannedPages.sort(compareByGroupAndPath)
}

export function readComponentNameMap(projectRoot: string): Map<string, string> {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc) {
    return new Map()
  }

  return new Map(indexDoc.components.map((component) => [component.key, component.name]))
}

function serializePage(
  page: Pick<ExamplePageEntry, 'key' | 'group' | 'label' | 'status'>,
): string {
  const fields = [`key: ${toSingleQuoted(page.key)}`]

  if (page.group) {
    fields.push(`group: ${toSingleQuoted(page.group)}`)
  }

  fields.push(`label: ${toSingleQuoted(page.label)}`)

  if (page.status) {
    fields.push(`status: ${toSingleQuoted(page.status)}`)
  }

  return `  { ${fields.join(', ')} },`
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
