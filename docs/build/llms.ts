import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import path from 'node:path'

import { defineMdastPlugin, mdxToJs } from 'satteri'
import type { Plugin } from 'vite'

import { loadComponentApiDoc, loadApiDocIndex } from './api-doc/load'
import type {
  ApiAttributeDoc,
  ComponentDoc,
  InheritedGroupDoc,
  ItemDoc,
  PropDoc,
  SlotAttributeDoc,
  SlotDoc,
} from './api-doc/types'
import { resolveDocsPageContext } from './core/paths'
import { parseExampleCode } from './examples/ast'
import { resolveExampleExportName } from './examples/module'
import { resolveExampleComponentSource } from './examples/source'
import { resolveExampleFile } from './markdown/examples'
import { readFrontmatterData } from './markdown/frontmatter'
import { asObjectRecord, getStaticStringAttribute } from './markdown/mdx'
import { DOCS_MDX_FEATURES } from './markdown/plugins'
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
}

interface PageConversionContext {
  projectRoot: string
  siteUrl: string
  routes: DocsRouteEntry[]
  sourcePath: string
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

function stringOffsetFromUtf8ByteOffset(source: Buffer, offset: number): number {
  return source.subarray(0, offset).toString('utf8').length
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

function renderSlotAttributes(slot: SlotAttributeDoc): string[] {
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

function renderSlot(slot: SlotDoc, attributes?: SlotAttributeDoc): string[] {
  const output = [`#### \`${slot.name}\``, '']
  if (slot.description) {
    output.push(slot.description, '')
  }
  if (attributes) {
    output.push(...renderSlotAttributes(attributes))
  }
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
  const output = ['## API Reference', '']
  const attributes = apiDoc.attributes
  const attributeBySlot = new Map(
    (attributes?.slots ?? []).map((slot) => [slot.name, slot] as const),
  )

  if (apiDoc.slots.length > 0) {
    output.push('### Attributes', '')
    for (const slot of apiDoc.slots) {
      output.push(...renderSlot(slot, attributeBySlot.get(slot.name)))
    }
  }

  if (apiDoc.props.own.length > 0) {
    output.push('### Props', '', renderPropTable(apiDoc.props.own), '')
  }

  if (apiDoc.item) {
    output.push(...renderItem(apiDoc.item))
  }

  if (attributes?.aria.length) {
    output.push(
      '### ARIA',
      '',
      'Accessibility attributes and roles emitted by the component markup.',
      '',
      renderAttributeTable(attributes.aria),
      '',
    )
  }

  if (attributes?.data.length) {
    output.push(
      '### Data Attributes',
      '',
      'State and slot attributes exposed for styling hooks and selectors.',
      '',
      renderAttributeTable(attributes.data),
      '',
    )
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

async function renderExampleNode(node: MdxComponentNode, context: PageConversionContext) {
  const examplePath = getComponentAttribute(node, 'path', context.sourcePath)?.trim()
  if (!examplePath) {
    throw new Error(
      `[docs-llms] <Example /> requires a static "path" string in ${context.sourcePath}`,
    )
  }
  if (node.hasChildren) {
    throw new Error(`[docs-llms] <Example /> cannot have children in ${context.sourcePath}`)
  }

  const exampleSourcePath = resolveExampleFile(context.sourcePath, examplePath)
  const source = await readFile(exampleSourcePath, 'utf8')
  const exportName = resolveExampleExportName(await parseExampleCode(source), exampleSourcePath)
  const componentSource = await resolveExampleComponentSource(source, exportName, parseExampleCode)
  if (!componentSource) {
    throw new Error(`[docs-llms] unable to extract the example component from ${exampleSourcePath}`)
  }
  return codeFence('tsx', componentSource)
}

function renderCodeTabsNode(node: MdxComponentNode, context: PageConversionContext): string {
  const packageName = getComponentAttribute(node, 'package', context.sourcePath)?.trim()
  if (!packageName) {
    throw new Error(
      `[docs-llms] <CodeTabs /> requires a static "package" string in ${context.sourcePath}`,
    )
  }
  if (node.hasChildren) {
    throw new Error(`[docs-llms] <CodeTabs /> cannot have children in ${context.sourcePath}`)
  }
  return [
    codeFence('bash', `bun add ${packageName}`),
    codeFence('bash', `pnpm add ${packageName}`),
    codeFence('bash', `npm i ${packageName}`),
  ].join('\n')
}

function renderComponentNode(
  node: MdxComponentNode,
  context: PageConversionContext,
): Promise<string> | string {
  if (node.name === 'Example') {
    return renderExampleNode(node, context)
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

function collectMdxComponents(
  source: string,
  sourcePath: string,
): {
  plugin: ReturnType<typeof defineMdastPlugin>
  nodes: MdxComponentNode[]
} {
  const nodes: MdxComponentNode[] = []
  const sourceBuffer = Buffer.from(source)
  const visit = (node: unknown) => {
    const record = asObjectRecord(node)
    const position = asObjectRecord(record?.position)
    const start = asObjectRecord(position?.start)
    const end = asObjectRecord(position?.end)
    if (
      !record ||
      typeof record.name !== 'string' ||
      record.name[0] !== record.name[0]?.toUpperCase() ||
      !Array.isArray(record.attributes) ||
      typeof start?.offset !== 'number' ||
      typeof end?.offset !== 'number'
    ) {
      return
    }
    nodes.push({
      name: record.name,
      attributes: record.attributes,
      start: stringOffsetFromUtf8ByteOffset(sourceBuffer, start.offset),
      end: stringOffsetFromUtf8ByteOffset(sourceBuffer, end.offset),
      hasChildren: Array.isArray(record.children) && record.children.length > 0,
    })
  }

  return {
    plugin: defineMdastPlugin({
      name: `moraine-llms-components-${path.basename(sourcePath)}`,
      mdxJsxFlowElement: visit,
      mdxJsxTextElement: visit,
    }),
    nodes,
  }
}

async function convertPageMarkdown(
  source: string,
  context: PageConversionContext,
): Promise<string> {
  const components = collectMdxComponents(source, context.sourcePath)
  await mdxToJs(source, {
    jsx: true,
    features: DOCS_MDX_FEATURES,
    mdastPlugins: [components.plugin],
  })
  const replacements = await Promise.all(
    components.nodes.map(async (node) => ({
      start: node.start,
      end: node.end,
      value: await renderComponentNode(node, context),
    })),
  )

  let output = source
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`
  }

  const frontmatter = readFrontmatterData(source.slice(0, 4096), context.sourcePath)
  output = output.replace(/^---\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, '')
  output = normalizeInternalLinks(output, context.siteUrl, context.routes)
  const header = `# ${frontmatter.title}\n\n> ${frontmatter.description}\n`
  const body = output.trim()
  const apiDoc = loadComponentApiDoc(
    context.projectRoot,
    resolveDocsPageContext(context.sourcePath).pageKey,
  )
  return `${header}\n${body}${body ? '\n\n' : '\n'}${apiDoc ? `\n${renderApiReference(apiDoc)}` : ''}`.replace(
    /\n{3,}/g,
    '\n\n',
  )
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
    'Moraine is an accessible, composable SolidJS component library. Use the linked Markdown pages for installation guidance, component behavior, examples, and API details.',
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
