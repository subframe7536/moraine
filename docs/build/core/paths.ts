import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { toPosixPath } from './strings'

export const DOCS_PAGE_FILE_RE = /[\\/]docs[\\/]pages[\\/].*\.mdx$/

export interface DocsPageContext {
  absolutePath: string
  docsRoot: string
  pagesRoot: string
  relativePath: string
  pageKey: string
  group?: string
  runtimeImportPath: string
}

function derivePageKey(relativePath: string): string {
  const fileBaseName = path.basename(relativePath, '.mdx')
  const parentDirectory = path.basename(path.dirname(relativePath))
  return parentDirectory === fileBaseName ? parentDirectory : fileBaseName
}

export function resolveDocsPageContext(absolutePath: string): DocsPageContext {
  const normalized = toPosixPath(path.normalize(absolutePath))
  const marker = '/docs/pages/'
  const markerIndex = normalized.lastIndexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`[docs-plugin] page path is outside docs/pages: ${absolutePath}`)
  }

  const docsRoot = path.normalize(normalized.slice(0, markerIndex + '/docs'.length))
  const pagesRoot = path.join(docsRoot, 'pages')
  const relativePath = normalized.slice(markerIndex + marker.length)
  const group = toPosixPath(path.dirname(relativePath)).split('/')[0]

  return {
    absolutePath: path.normalize(absolutePath),
    docsRoot,
    pagesRoot,
    relativePath,
    pageKey: derivePageKey(relativePath),
    group: group === '.' ? undefined : group,
    runtimeImportPath: `./pages/${relativePath}`,
  }
}

export function collectFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!existsSync(dir)) {
    return []
  }

  const files: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  )

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate))
      continue
    }

    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

export function collectMarkdownFiles(dir: string): string[] {
  return collectFiles(dir, (file) => file.endsWith('.mdx'))
}

export function toImportPath(fromFile: string, toFile: string): string {
  const relative = toPosixPath(path.relative(path.dirname(fromFile), toFile))
  return relative.startsWith('.') ? relative : `./${relative}`
}
