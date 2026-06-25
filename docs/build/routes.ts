import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { loadApiDocIndex } from './api-doc/load'
import { resolveDocsPageContext, toImportPath } from './core/paths'
import { extractDocsHeaderProps } from './markdown/compile'

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

function toTitleCaseFromKey(key: string): string {
  return key
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function collectMarkdownFiles(dir: string): string[] {
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
      files.push(...collectMarkdownFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

function normalizeStatus(value: unknown): DocsRouteStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  return STATUS_ALIASES.get(value.trim().toLowerCase())
}

function readRouteStatus(sourcePath: string): DocsRouteStatus | undefined {
  try {
    const markdown = readFileSync(sourcePath, 'utf8')
    return normalizeStatus(extractDocsHeaderProps(markdown, sourcePath)?.status)
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
        routePath: isRoot ? 'index.tsx' : path.join(page.group ? `(${page.group})` : '', `${key}.tsx`),
      }
    })
    .sort(compareRoutes)
}

function serializeRouteInfo(info: DocsRouteInfo): string {
  return JSON.stringify(info, null, 2)
}

function routeModuleCode(entry: DocsRouteEntry, outputPath: string): string {
  const importPath = toImportPath(outputPath, entry.sourcePath)
  return [
    "import { Suspense, lazy } from 'solid-js'",
    "import { createRoute } from 'solid-file-router'",
    '',
    `const Page = lazy(() => import('${importPath}'))`,
    '',
    'function DocsPageRoute() {',
    '  if (import.meta.env.SSR) {',
    '    return <main class="px-5 py-8 min-h-screen" />',
    '  }',
    '',
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

export function writeGeneratedRoutes(projectRoot: string): DocsRouteEntry[] {
  const docsRoot = path.join(projectRoot, 'docs')
  const generatedPagesRoot = path.join(docsRoot, '.generated/pages')
  const routes = scanDocsRoutes(projectRoot)

  rmSync(generatedPagesRoot, { recursive: true, force: true })
  mkdirSync(generatedPagesRoot, { recursive: true })

  writeFileSync(
    path.join(generatedPagesRoot, '_app.tsx'),
    [
      "import { createRoute } from 'solid-file-router'",
      "import { DocsAppLayout } from '../../components/docs-app-layout'",
      '',
      'export default createRoute({',
      '  component: (props) => <DocsAppLayout>{props.children}</DocsAppLayout>,',
      '})',
      '',
    ].join('\n'),
    'utf8',
  )

  writeFileSync(
    path.join(generatedPagesRoot, '404.tsx'),
    [
      "import { createRoute } from 'solid-file-router'",
      "import { DocsNotFound } from '../../components/docs-not-found'",
      '',
      'export default createRoute({',
      '  component: () => <DocsNotFound />,',
      '})',
      '',
    ].join('\n'),
    'utf8',
  )

  for (const route of routes) {
    const outputPath = path.join(generatedPagesRoot, route.routePath)
    mkdirSync(path.dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, routeModuleCode(route, outputPath), 'utf8')
  }

  return routes
}

export function getDocsPrerenderRoutes(projectRoot: string): string[] {
  return writeGeneratedRoutes(projectRoot).map((route) =>
    route.info.key === ROOT_ROUTE_KEY ? '/' : `/${route.info.key}`,
  )
}
