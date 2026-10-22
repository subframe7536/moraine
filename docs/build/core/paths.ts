import { existsSync, readdirSync } from 'node:fs'

import path from 'pathe'

import type { DocsSurface } from '../../shared/docs-route.ts'

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
  const segments = path
    .normalize(relativePath)
    .replace(/\.mdx$/, '')
    .split('/')
  const firstSegment = segments.shift()
  if (firstSegment !== 'docs' && firstSegment !== 'components' && firstSegment !== 'hooks') {
    throw new Error(`[docs-plugin] unknown docs surface in ${relativePath}`)
  }

  if (firstSegment === 'hooks') {
    const isIndex = segments.at(-1) === 'index'
    const section = isIndex ? 'overview' : 'hooks'
    const routeSegments = segments.filter((segment) => !/^\([^)]+\)$/.test(segment))
    if (isIndex) {
      routeSegments.pop()
    }
    const routePath = `/${['hooks', ...routeSegments].join('/')}`
    return {
      surface: 'hooks' as DocsSurface,
      section,
      routePath,
      markdownPath: `${routePath}.md`,
    }
  }

  const surface: DocsSurface = firstSegment
  if (surface === 'components') {
    const routeSegments = segments.filter((segment) => !/^\([^)]+\)$/.test(segment))
    if (routeSegments.at(-1) === 'index') {
      routeSegments.pop()
    }
    const section = routeSegments.length === 0 ? 'overview' : 'components'
    const routePath = `/${[surface, ...routeSegments].join('/')}`
    return { surface, section, routePath, markdownPath: `${routePath}.md` }
  }

  const sectionSegment = segments.find((segment) =>
    /^(\(overview\)|\(guides\)|\(styling\))$/.test(segment),
  )
  const section = sectionSegment?.replace(/[()]/g, '') ?? ''
  if (!section) {
    throw new Error(`[docs-plugin] unknown docs section in ${relativePath}`)
  }
  const routeSegments = segments.filter((segment) => !/^\([^)]+\)$/.test(segment))
  if (routeSegments.at(-1) === 'index') {
    routeSegments.pop()
  }
  const routePath = `/${[surface, ...routeSegments].join('/')}`
  return { surface, section, routePath, markdownPath: `${routePath}.md` }
}

export function resolveDocsPageContext(absolutePath: string): DocsPageContext {
  const normalized = path.normalize(absolutePath)
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
  const relative = path.relative(path.dirname(fromFile), toFile)
  return relative.startsWith('.') ? relative : `./${relative}`
}
