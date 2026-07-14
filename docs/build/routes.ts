import { closeSync, openSync, readSync } from 'node:fs'
import path from 'node:path'

import type {
  RouteSourceEntry,
  RouteSourceLoadContext,
  RouteSourceProvider,
} from 'solid-file-router/plugin'

import { loadApiDocIndex } from './api-doc/load'
import { collectMarkdownFiles, resolveDocsPageContext, toImportPath } from './core/paths'
import { readFrontmatterData } from './markdown/frontmatter'
import type { FrontmatterData } from './markdown/types'

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

const ROOT_ROUTE_KEY = 'introduction'
const APP_ROUTE_ID = 'routes/_app.tsx'
const NOT_FOUND_ROUTE_ID = '404.tsx'
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
      const isRoot = key === ROOT_ROUTE_KEY && !page.group
      const frontmatter = readRouteFrontmatter(sourcePath)
      const info: DocsRouteInfo = {
        key,
        title: frontmatter.title,
        description: frontmatter.description,
        order: frontmatter.sidebar.order,
        tags: frontmatter.search.tags,
        ...(page.group ? { group: page.group } : {}),
        ...(frontmatter.sidebar.badge ? { badge: frontmatter.sidebar.badge } : {}),
        ...(componentKeys.has(key) ? { api: key } : {}),
      }

      return {
        info,
        sourcePath,
        routePath: isRoot
          ? 'index.tsx'
          : path.join(page.group ? `(${page.group})` : '', `${key}.tsx`),
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

function serializeRouteInfo(info: DocsRouteInfo): string {
  return JSON.stringify(info, null, 2)
}

function toRouteId(entry: DocsRouteEntry): string {
  return entry.info.key === ROOT_ROUTE_KEY ? '/' : `/${entry.info.key}`
}

function toRouteSourcePath(projectRoot: string, sourcePath: string): string {
  return toImportPath(path.join(projectRoot, 'docs/index.tsx'), sourcePath).replace(/^\.\//, '')
}

function routeModuleCode(entry: DocsRouteEntry, context: RouteSourceLoadContext): string {
  const importPath = toImportPath(context.moduleId, entry.sourcePath)
  return [
    "import { Suspense, lazy } from 'solid-js'",
    "import { createRoute } from 'solid-file-router'",
    '',
    `const Page = lazy(() => import('${importPath}'))`,
    '',
    'function DocsPageRoute() {',
    '  return (',
    '    <Suspense fallback={<main class="px-5 py-8 min-h-screen" />}>',
    '      <Page />',
    '    </Suspense>',
    '  )',
    '}',
    '',
    'export default createRoute({',
    `  info: ${serializeRouteInfo(entry.info)},`,
    '  component: DocsPageRoute,',
    '})',
    '',
  ].join('\n')
}

function appRouteModuleCode(context: RouteSourceLoadContext): string {
  const importPath = toImportPath(context.moduleId, context.sourcePath).replace(/\.tsx$/, '')
  return [
    "import { createRoute } from 'solid-file-router'",
    `import { DocsAppLayout } from '${importPath}'`,
    '',
    'export default createRoute({',
    '  component: (props) => <DocsAppLayout>{props.children}</DocsAppLayout>,',
    '})',
    '',
  ].join('\n')
}

function notFoundRouteModuleCode(context: RouteSourceLoadContext): string {
  const importPath = toImportPath(context.moduleId, context.sourcePath).replace(/\.tsx$/, '')
  return [
    "import { createRoute } from 'solid-file-router'",
    `import { DocsNotFound } from '${importPath}'`,
    '',
    'export default createRoute({',
    '  component: () => <DocsNotFound />,',
    '})',
    '',
  ].join('\n')
}

export function createDocsRouteSource(projectRoot: string): RouteSourceProvider {
  const docsRoot = path.join(projectRoot, 'docs')
  let cachedRoutes: DocsRouteEntry[] | null = null

  const getRoutes = () => {
    cachedRoutes ??= scanDocsRoutes(projectRoot)
    return cachedRoutes
  }

  return {
    scan: () => {
      cachedRoutes = scanDocsRoutes(projectRoot)
      return [
        {
          routeId: APP_ROUTE_ID,
          routePath: '_app.tsx',
          sourcePath: 'components/docs-app-layout.tsx',
        },
        ...cachedRoutes.map<RouteSourceEntry>((route) => ({
          routeId: toRouteId(route),
          routePath: route.routePath,
          sourcePath: toRouteSourcePath(projectRoot, route.sourcePath),
        })),
        {
          routeId: NOT_FOUND_ROUTE_ID,
          routePath: '404.tsx',
          sourcePath: 'components/docs-not-found.tsx',
        },
      ]
    },
    load(context) {
      if (context.routeId === `/${APP_ROUTE_ID}`) {
        return appRouteModuleCode(context)
      }
      if (context.routePath === NOT_FOUND_ROUTE_ID) {
        return notFoundRouteModuleCode(context)
      }

      const sourcePath = path.normalize(context.sourcePath)
      const route = getRoutes().find((entry) => path.normalize(entry.sourcePath) === sourcePath)
      if (!route) {
        return null
      }
      return routeModuleCode(route, context)
    },
    watchFiles: [path.relative(docsRoot, path.join(projectRoot, 'docs/pages'))],
  }
}

export function getDocsPrerenderRoutes(projectRoot: string): string[] {
  return scanDocsRoutes(projectRoot).map((route) => toRouteId(route))
}
