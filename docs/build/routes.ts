import { closeSync, openSync, readSync } from 'node:fs'
import path from 'node:path'

import { loadApiDocIndex } from './api-doc/load.ts'
import { collectMarkdownFiles, resolveDocsPageContext } from './core/paths.ts'
import { readFrontmatterData } from './markdown/frontmatter.ts'
import type { FrontmatterData } from './markdown/types.ts'

export interface DocsRouteInfo {
  key: string
  title: string
  description: string
  order: number
  tags: string[]
  group?: string
  badge?: string
  api?: string
}

export interface DocsRouteEntry {
  info: DocsRouteInfo
  sourcePath: string
  routePath: string
}

function docsProviderPath(page: ReturnType<typeof resolveDocsPageContext>): string {
  return page.relativePath.replace(/\.mdx$/i, '.tsx')
}

const FRONTMATTER_READ_BYTES = 4096

function readFrontmatterPrefix(sourcePath: string): string {
  const descriptor = openSync(sourcePath, 'r')
  try {
    const buffer = Buffer.alloc(FRONTMATTER_READ_BYTES)
    const bytesRead = readSync(descriptor, buffer, 0, buffer.length, 0)
    return buffer.toString('utf8', 0, bytesRead)
  } finally {
    closeSync(descriptor)
  }
}

function readRouteFrontmatter(sourcePath: string): FrontmatterData {
  return readFrontmatterData(readFrontmatterPrefix(sourcePath), sourcePath)
}

function createComponentKeySet(projectRoot: string): Set<string> {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc) {
    return new Set()
  }

  return new Set(indexDoc.components.map((component) => component.key))
}

const GROUP_ORDER = new Map<string, number>([
  ['', 0],
  ['form', 1],
  ['general', 2],
  ['navigation', 3],
  ['overlay', 4],
])

function compareRoutes(left: DocsRouteEntry, right: DocsRouteEntry): number {
  const leftGroup = left.info.group ?? ''
  const rightGroup = right.info.group ?? ''
  const groupDifference =
    (GROUP_ORDER.get(leftGroup) ?? Number.MAX_SAFE_INTEGER) -
    (GROUP_ORDER.get(rightGroup) ?? Number.MAX_SAFE_INTEGER)
  if (groupDifference !== 0) {
    return groupDifference
  }
  if (leftGroup !== rightGroup) {
    return leftGroup.localeCompare(rightGroup)
  }
  return left.info.order - right.info.order
}

export function scanDocsRoutes(projectRoot: string): DocsRouteEntry[] {
  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const componentKeys = createComponentKeySet(projectRoot)

  const routes = collectMarkdownFiles(pagesRoot)
    .map((sourcePath) => {
      const page = resolveDocsPageContext(sourcePath)
      const key = page.pageKey
      const frontmatter = readRouteFrontmatter(sourcePath)
      const info = createDocsRouteInfo(key, page.group, frontmatter, componentKeys)

      return {
        info,
        sourcePath,
        routePath: docsProviderPath(page),
      }
    })
    .sort(compareRoutes)

  const ordersByGroup = new Map<string, Map<number, string>>()
  for (const route of routes) {
    const group = route.info.group ?? ''
    const orders = ordersByGroup.get(group) ?? new Map<number, string>()
    const duplicatePath = orders.get(route.info.order)
    if (duplicatePath) {
      throw new Error(
        `[docs-routes] duplicate sidebar.order ${route.info.order} in group ${group || '<root>'}: ${duplicatePath} and ${route.sourcePath}`,
      )
    }
    orders.set(route.info.order, route.sourcePath)
    ordersByGroup.set(group, orders)
  }

  return routes
}

export function createDocsRouteInfo(
  key: string,
  group: string | undefined,
  frontmatter: FrontmatterData,
  componentKeys: ReadonlySet<string>,
): DocsRouteInfo {
  return {
    key,
    title: frontmatter.title,
    description: frontmatter.description,
    order: frontmatter.sidebar.order,
    tags: frontmatter.search.tags,
    ...(group ? { group } : {}),
    ...(frontmatter.sidebar.badge ? { badge: frontmatter.sidebar.badge } : {}),
    ...(componentKeys.has(key) ? { api: key } : {}),
  }
}
