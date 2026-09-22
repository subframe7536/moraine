import { readFileSync } from 'node:fs'
import path from 'node:path'

import { DOCS_GROUP_ORDER } from '../shared/docs-route.ts'
import type { DocsRouteInfo, DocsRouteSection } from '../shared/docs-route.ts'

import { loadApiDocIndex } from './api-doc/load.ts'
import { collectMarkdownFiles, resolveDocsPageContext } from './core/paths.ts'
import type { DocsPageContext } from './core/paths.ts'
import { readFrontmatterData } from './markdown/frontmatter.ts'
import type { FrontmatterData } from './markdown/types.ts'

export type { DocsRouteInfo, DocsRouteSection } from '../shared/docs-route.ts'

export interface DocsRouteEntry {
  info: DocsRouteInfo
  sourcePath: string
}

export interface DocsPageSource {
  page: DocsPageContext
  frontmatter: FrontmatterData
}

function readPageFrontmatter(sourcePath: string): FrontmatterData {
  return readFrontmatterData(readFileSync(sourcePath, 'utf8'), sourcePath)
}

export function scanDocsPages(projectRoot: string): DocsPageSource[] {
  return collectMarkdownFiles(path.join(projectRoot, 'docs/pages')).map((sourcePath) => ({
    page: resolveDocsPageContext(sourcePath),
    frontmatter: readPageFrontmatter(sourcePath),
  }))
}

function createComponentKeySet(projectRoot: string): Set<string> {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc) {
    return new Set()
  }

  return new Set(indexDoc.components.map((component) => component.key))
}

function compareRoutes(left: DocsRouteEntry, right: DocsRouteEntry): number {
  const leftGroup = left.info.group ?? ''
  const rightGroup = right.info.group ?? ''
  const groupDifference =
    (DOCS_GROUP_ORDER.get(leftGroup) ?? Number.MAX_SAFE_INTEGER) -
    (DOCS_GROUP_ORDER.get(rightGroup) ?? Number.MAX_SAFE_INTEGER)
  if (groupDifference !== 0) {
    return groupDifference
  }
  if (leftGroup !== rightGroup) {
    return leftGroup.localeCompare(rightGroup)
  }
  return left.info.order - right.info.order
}

export function scanDocsRoutes(
  projectRoot: string,
  pages: readonly DocsPageSource[] = scanDocsPages(projectRoot),
): DocsRouteEntry[] {
  const componentKeys = createComponentKeySet(projectRoot)

  const routes = pages
    .map(({ page, frontmatter }) => {
      const key = page.pageKey
      const info = createDocsRouteInfo(key, page.group, frontmatter, componentKeys)

      return {
        info,
        sourcePath: page.absolutePath,
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
  sections: readonly DocsRouteSection[] = [],
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
    ...(sections.length > 0 ? { sections: [...sections] } : {}),
  }
}
