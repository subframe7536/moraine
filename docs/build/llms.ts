import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import path from 'node:path'

import {
  createMdxMdastHandle,
  defineMdastPlugin,
  dropHandle,
  resolveMdastSubscriptions,
  visitMdastHandle,
} from 'satteri'
import type { Plugin } from 'vite'

import { loadComponentApiDoc, loadApiDocIndex } from './api-doc/load.ts'
import { createApiReferenceModel } from './api-doc/presentation.ts'
import type { PresentationAttributesSection, PresentationPropItem } from './api-doc/presentation.ts'
import type { ComponentApi } from './api-doc/types.ts'
import { readFrontmatterData } from './markdown/frontmatter.ts'
import {
  asObjectRecord,
  getMdxAttributeValue,
  getStaticStringAttribute,
  readCodeTabSource,
} from './markdown/mdx.ts'
import type { MdxNode } from './markdown/mdx.ts'
import { DOCS_MDX_FEATURES } from './markdown/plugins.ts'
import { resolvePreviewFile } from './markdown/previews.ts'
import { parsePreviewCode } from './previews/ast.ts'
import { resolvePreviewExportName } from './previews/module.ts'
import { resolvePreviewComponentSource } from './previews/source.ts'
import { scanDocsRoutes } from './routes.ts'
import type { DocsRouteEntry } from './routes.ts'

export interface LlmsTxtPluginOptions {
  projectRoot: string
  siteName: string
  description: string
  siteUrl: string
}

export interface LlmsDocument {
  fileName: string
  source: string
}

interface MdxComponentNode extends MdxNode {
  name: string
  attributes: unknown[]
  start: number
  end: number
  hasChildren: boolean
}

interface PageConversionContext {
  projectRoot: string
  siteUrl: string
  routes: DocsRouteEntry[]
  sourcePath: string
  markdownSource?: string
}

const COMPONENT_CATEGORIES = new Map<string, string>([
  ['elements', 'Elements'],
  ['forms', 'Forms'],
  ['navigation', 'Navigation'],
  ['overlays', 'Overlays'],
  ['utilities', 'Utilities'],
])

const GROUP_TITLES = new Map<string, string>([
  ['', 'Guides'],
  ['form', 'Form'],
  ['general', 'General'],
  ['navigation', 'Navigation'],
  ['overlay', 'Overlay'],
])

const INTRO_CARD_CONTENT = [
  [
    'Composable API',
    'Slot-based APIs with class and style overrides, designed for real product surfaces.',
  ],
  [
    'Variant Coverage',
    'Visual variants, sizes, orientation, and state controls aligned across components.',
  ],
  [
    'Accessible by Default',
    'Keyboard and aria-ready primitives built on top of mature SolidJS foundations.',
  ],
] as const

const PLAYGROUND_SECTION_PATTERN = /^## Playground\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/gm

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
}

function absoluteUrl(siteUrl: string, value: string): string {
  return new URL(value.replace(/^\//, ''), normalizeSiteUrl(siteUrl)).toString()
}

function markdownFileName(route: DocsRouteEntry): string {
  return route.info.key === 'introduction' ? 'index.md' : `${route.info.key}.md`
}

function markdownPageUrl(siteUrl: string, route: DocsRouteEntry): string {
  return absoluteUrl(siteUrl, markdownFileName(route))
}

function routeByKey(routes: DocsRouteEntry[]): Map<string, DocsRouteEntry> {
  return new Map(routes.map((route) => [route.info.key, route]))
}

function escapeTableCell(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll(/\r?\n/g, '<br>')
}

function readFrontmatterBlock(source: string): string {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)
  return match?.[0].trimEnd() ?? ''
}

function removePlaygroundSections(source: string): string {
  return source.replace(PLAYGROUND_SECTION_PATTERN, '')
}

function renderTable(rows: readonly (readonly string[])[], headers: readonly string[]): string {
  const renderRow = (row: readonly string[]) => `| ${row.map(escapeTableCell).join(' | ')} |`
  return [renderRow(headers), renderRow(headers.map(() => '---')), ...rows.map(renderRow)].join(
    '\n',
  )
}

function renderPropTable(props: readonly PresentationPropItem[], nameColumn = 'Prop'): string {
  const rows = props.map((prop) => [
    `${prop.name}${!prop.optional ? '*' : ''}`,
    prop.type,
    prop.defaultValue ?? '—',
    prop.description ?? '—',
  ])
  return renderTable(rows, [nameColumn, 'Type', 'Default', 'Description'])
}

function renderAttributes(attributes: PresentationAttributesSection): string {
  return renderTable(
    attributes.items.map((attribute) => [
      `\`${attribute.name}\``,
      attribute.slots.map((slot) => `\`${slot}\``).join(', '),
      attribute.description ?? '—',
    ]),
    ['Attributes', 'Slot', 'Description'],
  )
}

function renderApiReference(apiDoc: ComponentApi): string {
  const model = createApiReferenceModel(apiDoc)
  if (!model) {
    return ''
  }

  const output = ['## API', '']

  if (model.kind === 'single') {
    const rootPart = model.parts[0]
    if (rootPart) {
      const description = rootPart.description ?? model.description
      if (description) {
        output.push(description, '')
      }
      if (rootPart.props.length > 0) {
        output.push(renderPropTable(rootPart.props), '')
      }
    }
  } else {
    for (const part of model.parts) {
      output.push(`### ${part.heading}`, '')
      if (part.description) {
        output.push(part.description, '')
      }

      if (part.props.length) {
        output.push(renderPropTable(part.props), '')
      }
    }
  }

  if (model.item) {
    output.push('### Items', '')
    if (model.item.genericsSignature) {
      output.push(`Generics: \`${model.item.genericsSignature}\``, '')
    }
    if (model.item.description) {
      output.push(model.item.description, '')
    }
    output.push(renderPropTable(model.item.props, 'Field'), '')
  }

  if (model.attributes) {
    output.push('### Attributes', '', renderAttributes(model.attributes), '')
  }

  return `${output.join('\n').trimEnd()}\n`
}

function renderIntroCards(): string {
  return `${INTRO_CARD_CONTENT.map(([title, description]) => `- **${title}:** ${description}`).join('\n')}\n`
}

function renderIntroComponents(
  projectRoot: string,
  siteUrl: string,
  routes: DocsRouteEntry[],
): string {
  const indexDoc = loadApiDocIndex(projectRoot)
  if (!indexDoc || indexDoc.components.length === 0) {
    return ''
  }

  const routeMap = routeByKey(routes)
  const groups = new Map<string, typeof indexDoc.components>()
  for (const component of indexDoc.components) {
    const list = groups.get(component.category) ?? []
    list.push(component)
    groups.set(component.category, list)
  }

  const output: string[] = []
  for (const [category, components] of groups) {
    output.push(`#### ${COMPONENT_CATEGORIES.get(category) ?? category}`, '')
    for (const component of [...components].sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const route = routeMap.get(component.key)
      const url = route
        ? markdownPageUrl(siteUrl, route)
        : absoluteUrl(siteUrl, `${component.key}.md`)
      output.push(`- [${component.name}](${url})`)
    }
    output.push('')
  }
  return output.join('\n')
}

function getComponentAttribute(node: MdxComponentNode, name: string, id: string): string | null {
  return getStaticStringAttribute({ attributes: node.attributes }, node.name, name, id)
}

function codeFence(language: string, source: string): string {
  const fenceLength = Math.max(
    3,
    ...[...source.matchAll(/`+/g)]
      .map((match) => match[0]?.length ?? 0)
      .map((length) => length + 1),
  )
  const fence = '`'.repeat(fenceLength)
  return `${fence}${language}\n${source.trimEnd()}\n${fence}\n`
}

async function renderPreview(previewPath: string, context: PageConversionContext) {
  const previewSourcePath = resolvePreviewFile(context.sourcePath, previewPath)
  const source = await readFile(previewSourcePath, 'utf8')
  resolvePreviewExportName(await parsePreviewCode(source), previewSourcePath)
  const componentSource = await resolvePreviewComponentSource(source, parsePreviewCode)
  if (!componentSource) {
    throw new Error(`[docs-llms] unable to extract the preview component from ${previewSourcePath}`)
  }
  return codeFence('tsx', componentSource)
}

async function renderPreviewNode(node: MdxComponentNode, context: PageConversionContext) {
  const previewPath = getComponentAttribute(node, 'path', context.sourcePath)?.trim()
  if (!previewPath) {
    throw new Error(
      `[docs-llms] <Preview /> requires a static "path" string in ${context.sourcePath}`,
    )
  }
  if (node.hasChildren) {
    throw new Error(`[docs-llms] <Preview /> cannot have children in ${context.sourcePath}`)
  }

  return renderPreview(previewPath, context)
}

function renderCodeTabsNode(node: MdxComponentNode, context: PageConversionContext): string {
  const tabs = (node.children ?? [])
    .map((child) => readCodeTabSource(child, context.markdownSource))
    .filter((item) => item !== null)
  if (tabs.length > 0) {
    return tabs
      .map((item) => {
        const lang = item.lang || 'bash'
        const title = item.title === item.lang ? '' : item.title
        return codeFence(title ? `${lang} ${title}` : lang, item.code)
      })
      .join('\n')
  }

  const items = getMdxAttributeValue(node, 'items')
  if (Array.isArray(items)) {
    return items
      .map(asObjectRecord)
      .filter((item) => item !== null)
      .map((item) => {
        const lang = typeof item.lang === 'string' && item.lang ? item.lang : 'bash'
        const title = typeof item.title === 'string' ? item.title : ''
        const code = typeof item.code === 'string' ? item.code : ''
        return codeFence(title ? `${lang} ${title}` : lang, code)
      })
      .join('\n')
  }

  const packageName = getComponentAttribute(node, 'package', context.sourcePath)?.trim()
  if (packageName) {
    return [
      codeFence('bash bun', `bun add ${packageName}`),
      codeFence('bash pnpm', `pnpm add ${packageName}`),
      codeFence('bash npm', `npm i ${packageName}`),
    ].join('\n')
  }

  return ''
}

function renderComponentNode(
  node: MdxComponentNode,
  context: PageConversionContext,
): Promise<string> | string {
  if (node.name === 'Preview') {
    return renderPreviewNode(node, context)
  }
  if (node.name === 'CodeTabs') {
    return renderCodeTabsNode(node, context)
  }
  if (node.name === 'IntroCards') {
    return renderIntroCards()
  }
  if (node.name === 'IntroComponents') {
    return renderIntroComponents(context.projectRoot, context.siteUrl, context.routes)
  }
  if (node.name === 'ToastHosts') {
    return ''
  }
  throw new Error(`[docs-llms] unsupported JSX component <${node.name}> in ${context.sourcePath}`)
}

function copyMdxNode(value: unknown): MdxNode | null {
  const record = asObjectRecord(value)
  if (!record) {
    return null
  }
  const position = asObjectRecord(record.position)
  const start = asObjectRecord(position?.start)
  const end = asObjectRecord(position?.end)
  const children = Array.isArray(record.children)
    ? record.children.map(copyMdxNode).filter((child) => child !== null)
    : undefined
  return {
    ...(typeof record.type === 'string' ? { type: record.type } : {}),
    ...(typeof record.name === 'string' ? { name: record.name } : {}),
    ...(Array.isArray(record.attributes) ? { attributes: [...record.attributes] } : {}),
    ...(typeof record.value === 'string' ? { value: record.value } : {}),
    ...(typeof record.lang === 'string' ? { lang: record.lang } : {}),
    ...(typeof record.meta === 'string' ? { meta: record.meta } : {}),
    ...(typeof start?.offset === 'number' && typeof end?.offset === 'number'
      ? { position: { start: { offset: start.offset }, end: { offset: end.offset } } }
      : {}),
    ...(children ? { children } : {}),
  }
}

function createLlmsMdastPlugin(sourcePath: string, nodes: MdxComponentNode[]) {
  const visit = (node: unknown) => {
    const record = asObjectRecord(node)
    const position = asObjectRecord(record?.position)
    const start = asObjectRecord(position?.start)
    const end = asObjectRecord(position?.end)
    if (
      !record ||
      typeof record.name !== 'string' ||
      record.name[0] !== record.name[0]?.toUpperCase() ||
      record.name === 'CodeTabs.Item' ||
      !Array.isArray(record.attributes) ||
      typeof start?.offset !== 'number' ||
      typeof end?.offset !== 'number'
    ) {
      return
    }
    const snapshot = copyMdxNode(node)
    if (!snapshot) {
      return
    }
    nodes.push({
      ...snapshot,
      name: record.name,
      attributes: record.attributes,
      start: start.offset,
      end: end.offset,
      hasChildren: Array.isArray(record.children) && record.children.length > 0,
    })
  }

  return defineMdastPlugin({
    name: `moraine-llms-components-${path.basename(sourcePath)}`,
    mdxJsxFlowElement: visit,
    mdxJsxTextElement: visit,
  })
}

async function collectMdxComponents(source: string, sourcePath: string) {
  const nodes: MdxComponentNode[] = []
  const plugin = createLlmsMdastPlugin(sourcePath, nodes)
  const handle = createMdxMdastHandle(source, DOCS_MDX_FEATURES, true)
  try {
    await visitMdastHandle(
      handle,
      plugin,
      resolveMdastSubscriptions(plugin),
      source,
      undefined,
      {},
      'mdx',
    )
  } finally {
    dropHandle(handle)
  }
  return nodes
}

async function convertPageMarkdown(
  source: string,
  context: PageConversionContext,
): Promise<string> {
  const markdownSource = removePlaygroundSections(source)
  const components = await collectMdxComponents(markdownSource, context.sourcePath)
  const pageContext: PageConversionContext = {
    ...context,
    markdownSource,
  }
  const replacements = await Promise.all(
    components.map(async (node) => ({
      start: node.start,
      end: node.end,
      value: await renderComponentNode(node, pageContext),
    })),
  )

  let output = markdownSource
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`
  }

  const frontmatter = readFrontmatterData(source.slice(0, 4096), context.sourcePath)
  const frontmatterBlock = readFrontmatterBlock(source)
  output = output.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '')
  output = normalizeInternalLinks(output, context.siteUrl, context.routes)
  const header = `# ${frontmatter.title}\n\n> ${frontmatter.description}\n`
  const body = output.trim()
  const apiDoc = loadComponentApiDoc(context.sourcePath)
  const content = `${header}\n${body}${body ? '\n\n' : '\n'}${apiDoc ? `\n${renderApiReference(apiDoc)}` : ''}`
  const normalizedContent = content.replace(/\n{3,}/g, '\n\n')
  return `${frontmatterBlock ? `${frontmatterBlock}\n\n` : ''}${normalizedContent}`
}

function normalizeInternalLinks(
  markdown: string,
  siteUrl: string,
  routes: DocsRouteEntry[],
): string {
  const routeMap = routeByKey(routes)
  return markdown.replace(/\]\((\/[^)]+)\)/g, (match, href: string) => {
    const hrefMatch = href.match(/^\/([^?#]*)([?#].*)?$/)
    if (!hrefMatch) {
      return match
    }
    const key = hrefMatch[1]?.split('/').pop() ?? ''
    const route = routeMap.get(key) ?? (key === '' ? routeMap.get('introduction') : undefined)
    return route ? `](${markdownPageUrl(siteUrl, route)}${hrefMatch[2] ?? ''})` : match
  })
}

export function buildLlmsTxt(
  options: LlmsTxtPluginOptions,
  routes = scanDocsRoutes(options.projectRoot),
) {
  const output = [
    `# ${options.siteName}`,
    '',
    `> ${options.description}`,
    '',
    'Moraine is an accessible, composable SolidJS component library. Use the linked Markdown pages for installation guidance, component behavior, previews, and API details.',
  ]
  let currentGroup: string | undefined
  for (const route of routes) {
    const group = route.info.group ?? ''
    if (group !== currentGroup) {
      currentGroup = group
      output.push('', `## ${GROUP_TITLES.get(group) ?? group}`, '')
    }
    output.push(
      `- [${route.info.title}](${markdownPageUrl(options.siteUrl, route)}): ${route.info.description}`,
    )
  }
  return `${output.join('\n').trimEnd()}\n`
}

export async function buildLlmsDocuments(options: LlmsTxtPluginOptions): Promise<LlmsDocument[]> {
  const routes = scanDocsRoutes(options.projectRoot)
  const documents: LlmsDocument[] = [
    { fileName: 'llms.txt', source: buildLlmsTxt(options, routes) },
  ]
  for (const route of routes) {
    const source = readFileSync(route.sourcePath, 'utf8')
    documents.push({
      fileName: markdownFileName(route),
      source: await convertPageMarkdown(source, {
        projectRoot: options.projectRoot,
        siteUrl: normalizeSiteUrl(options.siteUrl),
        routes,
        sourcePath: route.sourcePath,
      }),
    })
  }
  return documents
}

function isLlmsPath(url: string): boolean {
  return url === '/llms.txt' || /^\/[a-z0-9-]+\.md$/.test(url)
}

function sendMarkdownResponse(res: ServerResponse, document: LlmsDocument): void {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.end(document.source)
}

export function llmsTxtPlugin(options: LlmsTxtPluginOptions): Plugin {
  let documentsPromise: Promise<LlmsDocument[]> | undefined
  const pagesRoot = path.resolve(options.projectRoot, 'docs/pages')

  const getDocuments = () => {
    documentsPromise ??= buildLlmsDocuments(options).catch((error: unknown) => {
      documentsPromise = undefined
      throw error
    })
    return documentsPromise
  }

  const invalidate = () => {
    documentsPromise = undefined
  }

  return {
    name: 'moraine-llms-txt',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url ?? '/'
        const pathname = requestUrl.split('?')[0] ?? '/'
        if (!isLlmsPath(pathname)) {
          next()
          return
        }
        try {
          const document = (await getDocuments()).find((item) => `/${item.fileName}` === pathname)
          if (!document) {
            next()
            return
          }
          sendMarkdownResponse(response, document)
        } catch (error) {
          next(error)
        }
      })
    },
    watchChange(id) {
      const absoluteId = path.resolve(id)
      if (absoluteId === pagesRoot || absoluteId.startsWith(`${pagesRoot}${path.sep}`)) {
        invalidate()
      }
    },
    async generateBundle() {
      if (this.environment.name === 'ssr') {
        return
      }
      for (const document of await getDocuments()) {
        this.emitFile({ type: 'asset', fileName: document.fileName, source: document.source })
      }
    },
  }
}
