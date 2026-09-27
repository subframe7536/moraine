import { readFileSync } from 'node:fs'
import path from 'node:path'

import { DOCS_SECTION_ORDER } from '../shared/docs-route.ts'
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
  const leftGroup = `${left.info.surface}:${left.info.section}`
  const rightGroup = `${right.info.surface}:${right.info.section}`
  const groupDifference =
    (DOCS_SECTION_ORDER.get(leftGroup) ?? Number.MAX_SAFE_INTEGER) -
    (DOCS_SECTION_ORDER.get(rightGroup) ?? Number.MAX_SAFE_INTEGER)
  if (groupDifference !== 0) {
    return groupDifference
  }
  if (leftGroup !== rightGroup) {
    return leftGroup.localeCompare(rightGroup)
  }
  if (left.info.section === 'utils') {
    if (left.info.key === 'class-merging') {
      return -1
    }
    if (right.info.key === 'class-merging') {
      return 1
    }
    return left.info.title.localeCompare(right.info.title)
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
      const info = createDocsRouteInfo(page, frontmatter, componentKeys)

      return {
        info,
        sourcePath: page.absolutePath,
      }
    })
    .sort(compareRoutes)

  const ordersByGroup = new Map<string, Map<number, string>>()
  for (const route of routes) {
    const group = `${route.info.surface}:${route.info.section}`
    if (route.info.section === 'utils') {
      const orders = ordersByGroup.get(group) ?? new Map<number, string>()
      route.info.order = orders.size
      orders.set(route.info.order, route.sourcePath)
      ordersByGroup.set(group, orders)
      continue
    }
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
  page: DocsPageContext,
  frontmatter: FrontmatterData,
  componentKeys: ReadonlySet<string>,
  sections: readonly DocsRouteSection[] = [],
): DocsRouteInfo {
  return {
    key: page.pageKey,
    surface: page.surface,
    section: page.section,
    routePath: page.routePath,
    markdownPath: page.markdownPath,
    title: frontmatter.title,
    description: frontmatter.description,
    order: frontmatter.sidebar?.order ?? 0,
    tags: frontmatter.search.tags,
    ...(frontmatter.sidebar?.badge ? { badge: frontmatter.sidebar.badge } : {}),
    ...(componentKeys.has(page.pageKey) ? { api: page.pageKey } : {}),
    ...(sections.length > 0 ? { sections: [...sections] } : {}),
  }
}
