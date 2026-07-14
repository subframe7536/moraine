import { closeSync, openSync, readSync } from 'node:fs'
import path from 'node:path'

import type {
  RouteSourceEntry,
  RouteSourceLoadContext,
  RouteSourceProvider,
} from 'solid-file-router/plugin'

import { loadApiDocIndex } from './api-doc/load'
import { collectMarkdownFiles, resolveDocsPageContext, toImportPath } from './core/paths'
import { toTitleCaseFromKey } from './core/strings'
import { readFrontmatterData } from './markdown/frontmatter'

export type DocsRouteStatus = 'new' | 'update' | 'unreleased'

export interface DocsRouteInfo {
  key: string
  title: string
  group?: string
  status?: DocsRouteStatus
  api?: string
}

export interface DocsRouteEntry {
  info: DocsRouteInfo
  sourcePath: string
  routePath: string
}

const STATUS_ALIASES = new Map<string, DocsRouteStatus>([
  ['new', 'new'],
  ['update', 'update'],
  ['unreleased', 'unreleased'],
  ['unrelease', 'unreleased'],
])

const ROOT_ROUTE_KEY = 'introduction'
const APP_ROUTE_ID = 'routes/_app.tsx'
const NOT_FOUND_ROUTE_ID = '404.tsx'
const FRONTMATTER_READ_BYTES = 4096

function normalizeStatus(value: unknown): DocsRouteStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  return STATUS_ALIASES.get(value.trim().toLowerCase())
}

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

function readRouteStatus(sourcePath: string): DocsRouteStatus | undefined {
  try {
    return normalizeStatus(
      readFrontmatterData(readFrontmatterPrefix(sourcePath), sourcePath).status,
    )
  } catch {
    return undefined
  }
}

function createComponentNameMap(projectRoot: string): Map<string, string> {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc) {
    return new Map()
  }

  return new Map(indexDoc.components.map((component) => [component.key, component.name]))
}

function compareRoutes(left: DocsRouteEntry, right: DocsRouteEntry): number {
  if (left.info.key === ROOT_ROUTE_KEY) {
    return -1
  }
  if (right.info.key === ROOT_ROUTE_KEY) {
    return 1
  }
  if (!left.info.group && right.info.group) {
    return -1
  }
  if (left.info.group && !right.info.group) {
    return 1
  }
  return left.sourcePath.localeCompare(right.sourcePath)
}

export function scanDocsRoutes(projectRoot: string): DocsRouteEntry[] {
  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const componentNameMap = createComponentNameMap(projectRoot)

  return collectMarkdownFiles(pagesRoot)
    .map((sourcePath) => {
      const page = resolveDocsPageContext(sourcePath)
      const key = page.pageKey
      const isRoot = key === ROOT_ROUTE_KEY && !page.group
      const title = componentNameMap.get(key) ?? toTitleCaseFromKey(key)
      const status = readRouteStatus(sourcePath)
      const info: DocsRouteInfo = {
        key,
        title,
        ...(page.group ? { group: page.group } : {}),
        ...(status ? { status } : {}),
        ...(componentNameMap.has(key) ? { api: key } : {}),
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
