import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import type { DocsSurface } from '../../shared/docs-route.ts'

import { toPosixPath } from './strings.ts'

export const DOCS_PAGE_FILE_RE = /[\\/]docs[\\/]pages[\\/].*\.mdx$/

export interface DocsPageContext {
  absolutePath: string
  pagesRoot: string
  relativePath: string
  pageKey: string
  surface: DocsSurface
  section: string
  routePath: string
  markdownPath: string
}

function derivePageKey(relativePath: string): string {
  const fileBaseName = path.basename(relativePath, '.mdx')
  const parentDirectory = path.basename(path.dirname(relativePath))
  if (fileBaseName === 'index') {
    if (parentDirectory === '.') {
      throw new Error(
        `[docs-plugin] root index.mdx is reserved for the landing route: ${relativePath}`,
      )
    }
    return parentDirectory
  }
  return parentDirectory === fileBaseName ? parentDirectory : fileBaseName
}

function deriveRoute(relativePath: string) {
  const segments = toPosixPath(relativePath)
    .replace(/\.mdx$/, '')
    .split('/')
  const firstSegment = segments.shift()
  if (firstSegment !== 'docs' && firstSegment !== 'components') {
    throw new Error(`[docs-plugin] unknown docs surface in ${relativePath}`)
  }
  const surface: DocsSurface = firstSegment
  const sectionSegment = segments.find((segment) =>
    surface === 'docs'
      ? /^(\(overview\)|styling|\(composition\)|reference)$/.test(segment)
      : /^(\(general\)|\(form\)|\(navigation\)|\(overlay\))$/.test(segment),
  )
  const section =
    sectionSegment?.replace(/[()]/g, '') ?? (surface === 'components' ? 'overview' : '')
  if (!section) {
    throw new Error(`[docs-plugin] unknown docs section in ${relativePath}`)
  }
  const routeSegments = segments.filter((segment) => !/^\([^)]+\)$/.test(segment))
  if (routeSegments.at(-1) === 'index') {
    routeSegments.pop()
  }
  if (surface === 'components') {
    // Component groups are organizational; all component URLs have one public segment.
    routeSegments.splice(0, routeSegments.length - 1)
  }
  const routePath = `/${[surface, ...routeSegments].join('/')}`
  return { surface, section, routePath, markdownPath: `${routePath}.md` }
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
  const pageKey = derivePageKey(relativePath)
  const route = deriveRoute(relativePath)
  return {
    absolutePath: path.normalize(absolutePath),
    pagesRoot,
    relativePath,
    pageKey,
    ...route,
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
