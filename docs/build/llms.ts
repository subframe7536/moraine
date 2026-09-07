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

import { loadComponentApiDoc, loadApiDocIndex } from './api-doc/load'
import type {
  ApiAttributeDoc,
  ComponentDoc,
  InheritedGroupDoc,
  ItemDoc,
  PropDoc,
  SlotDoc,
} from './api-doc/types'
import { resolveDocsPageContext } from './core/paths'
import { readFrontmatterData } from './markdown/frontmatter'
import { asObjectRecord, getStaticStringAttribute } from './markdown/mdx'
import { DOCS_MDX_FEATURES } from './markdown/plugins'
import { resolvePreviewFile } from './markdown/previews'
import { parsePreviewCode } from './previews/ast'
import { resolvePreviewExportName } from './previews/module'
import { resolvePreviewComponentSource } from './previews/source'
import type { DocsRouteEntry } from './routes'
import { scanDocsRoutes } from './routes'

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

interface MdxComponentNode {
  name: string
  attributes: unknown[]
  start: number
  end: number
  hasChildren: boolean
  children?: unknown[]
}

interface PageConversionContext {
  projectRoot: string
  siteUrl: string
  routes: DocsRouteEntry[]
  sourcePath: string
  markdownSource?: string
}

function extractExpressionCode(exprNode: any, fullSource?: string): string {
  const start = exprNode?.position?.start?.offset
  const end = exprNode?.position?.end?.offset
  if (typeof start === 'number' && typeof end === 'number' && typeof fullSource === 'string') {
    let raw = fullSource.slice(start, end).trim()
    if (raw.startsWith('{') && raw.endsWith('}')) {
      raw = raw.slice(1, -1).trim()
    }
    if (raw.startsWith('`') && raw.endsWith('`')) {
      raw = raw.slice(1, -1)
    }
    return raw.replace(/^\r?\n/, '').replace(/\r?\n$/, '')
  }
  let val = (exprNode?.value ?? '').trim()
  if (val.startsWith('`') && val.endsWith('`')) {
    val = val.slice(1, -1)
  }
  return val
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

function normalizeApiType(type: string): string {
  return type.replaceAll('cls_variant0.', '').replaceAll('_$', '')
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

function renderPropTable(props: readonly PropDoc[], nameColumn = 'Prop'): string {
  const rows = props.map((prop) => [
    `${prop.name}${prop.required ? '*' : ''}`,
    normalizeApiType(prop.type),
    prop.defaultValue ?? '—',
    prop.description ?? '—',
  ])
  return renderTable(rows, [nameColumn, 'Type', 'Default', 'Description'])
}

function renderAttributeTable(attributes: readonly ApiAttributeDoc[], nameColumn = 'Attribute') {
  const rows = attributes.map((attribute) => [
    attribute.name,
    normalizeApiType(attribute.type),
    attribute.description || '—',
  ])
  return renderTable(rows, [nameColumn, 'Type', 'Description'])
}

function renderSlotAttributes(slot: SlotDoc): string[] {
  const output: string[] = []
  for (const [heading, attributes] of [
    ['CSS Variables', slot.cssVariables],
    ['Data Attributes', slot.dataAttributes],
    ['ARIA Attributes', slot.ariaAttributes],
  ] as const) {
    if (attributes.length === 0) {
      continue
    }
    output.push(`##### ${heading}`, '', renderAttributeTable(attributes), '')
  }
  return output
}

function renderSlot(slot: SlotDoc): string[] {
  const output = [`#### \`${slot.name}\``, '']
  if (slot.description) {
    output.push(slot.description, '')
  }
  output.push(...renderSlotAttributes(slot))
  return output
}

function renderInheritedGroup(group: InheritedGroupDoc): string[] {
  return [`#### From \`${group.from}\``, '', renderPropTable(group.props), '']
}

function renderItem(item: ItemDoc): string[] {
  const output = ['### Items', '']
  if (item.description) {
    output.push(item.description, '')
  }
  output.push(renderPropTable(item.props), '')
  return output
}

function renderApiReference(apiDoc: ComponentDoc): string {
  const output = ['## API', '']

  if (apiDoc.slots.length > 0) {
    output.push('### Attributes', '')
    for (const slot of apiDoc.slots) {
      output.push(...renderSlot(slot))
    }
  }

  if (apiDoc.props.own.length > 0) {
    output.push('### Props', '', renderPropTable(apiDoc.props.own), '')
  }

  if (apiDoc.item) {
    output.push(...renderItem(apiDoc.item))
  }

  if (apiDoc.props.inherited.length > 0) {
    output.push('### Inherited', '')
    for (const group of apiDoc.props.inherited) {
      output.push(...renderInheritedGroup(group))
    }
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
      const description = component.description ? `: ${component.description}` : ''
      output.push(`- [${component.name}](${url})${description}`)
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
  const exportName = resolvePreviewExportName(await parsePreviewCode(source), previewSourcePath)
  const componentSource = await resolvePreviewComponentSource(source, exportName, parsePreviewCode)
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
  const result: string[] = []

  if (Array.isArray(node.children)) {
    for (const child of node.children as any[]) {
      if (!child) {
        continue
      }

      if (child.name === 'CodeTabs.Item') {
        const langAttr = (child.attributes as any[])?.find((a: any) => a?.name === 'lang')
        const titleAttr = (child.attributes as any[])?.find((a: any) => a?.name === 'title')
        const codeAttr = (child.attributes as any[])?.find((a: any) => a?.name === 'code')

        let lang = (langAttr?.value?.value ?? langAttr?.value ?? '').toString().trim()
        let title = (titleAttr?.value?.value ?? titleAttr?.value ?? '').toString().trim()
        let code = (codeAttr?.value?.value ?? codeAttr?.value ?? '').toString()

        if (!code && Array.isArray(child.children)) {
          const codeChild = child.children.find((c: any) => c?.type === 'code')
          if (codeChild) {
            code = codeChild.value
            if (!lang && codeChild.lang) {
              lang = codeChild.lang
            }
            if (!title && codeChild.meta) {
              title = codeChild.meta
            }
          } else {
            const exprChild = child.children.find(
              (c: any) => c?.type === 'mdxFlowExpression' || c?.type === 'mdxTextExpression',
            )
            if (exprChild) {
              code = extractExpressionCode(exprChild, context.markdownSource)
            } else {
              const textParts: string[] = []
              for (const sub of child.children) {
                if (sub.value) {
                  textParts.push(sub.value)
                }
                if (Array.isArray(sub.children)) {
                  for (const pSub of sub.children) {
                    if (pSub.value) {
                      textParts.push(pSub.value)
                    }
                  }
                }
              }
              code = textParts.join('\n').trim()
            }
          }
        }

        lang ||= 'bash'
        const info = title ? `${lang} ${title}` : lang
        result.push(codeFence(info, code))
      } else if (child.type === 'code') {
        const info = child.lang || 'bash'
        result.push(codeFence(info, child.value))
      }
    }

    if (result.length > 0) {
      return result.join('\n')
    }
  }

  const itemsAttr = (node.attributes as any[]).find((attr: any) => attr?.name === 'items')
  if (itemsAttr) {
    try {
      const rawValue = itemsAttr.value?.value ?? itemsAttr.value
      const items = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
      if (Array.isArray(items)) {
        return items
          .map((item: any) => {
            const lang = item.lang || 'bash'
            const info = item.title ? `${lang} ${item.title}` : lang
            return codeFence(info, item.code || '')
          })
          .join('\n')
      }
    } catch {}
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

function createLlmsMdastPlugin(_source: string, sourcePath: string, nodes: MdxComponentNode[]) {
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
    const children = Array.isArray(record.children)
      ? record.children.map((child: any) => ({
          type: child?.type,
          name: child?.name,
          attributes: child?.attributes,
          lang: child?.lang,
          meta: child?.meta,
          value: child?.value,
          children: Array.isArray(child?.children)
            ? child.children.map((sub: any) => ({
                type: sub?.type,
                name: sub?.name,
                lang: sub?.lang,
                meta: sub?.meta,
                value: sub?.value,
                position: sub?.position,
                children: Array.isArray(sub?.children)
                  ? sub.children.map((pSub: any) => ({
                      type: pSub?.type,
                      value: pSub?.value,
                    }))
                  : undefined,
              }))
            : undefined,
        }))
      : undefined

    nodes.push({
      name: record.name,
      attributes: record.attributes,
      start: start.offset,
      end: end.offset,
      hasChildren: Array.isArray(record.children) && record.children.length > 0,
      children,
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
  const plugin = createLlmsMdastPlugin(source, sourcePath, nodes)
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
  const apiDoc = loadComponentApiDoc(
    context.projectRoot,
    resolveDocsPageContext(context.sourcePath).pageKey,
  )
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
  let isSsrBuild = false
  const pagesRoot = path.resolve(options.projectRoot, 'docs/pages')

  const getDocuments = () => {
    documentsPromise ??= buildLlmsDocuments(options)
    return documentsPromise
  }

  const invalidate = () => {
    documentsPromise = undefined
  }

  return {
    name: 'moraine-llms-txt',
    configResolved(config) {
      isSsrBuild = Boolean(config.build.ssr)
    },
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
      if (isSsrBuild) {
        return
      }
      for (const document of await getDocuments()) {
        this.emitFile({ type: 'asset', fileName: document.fileName, source: document.source })
      }
    },
  }
}
