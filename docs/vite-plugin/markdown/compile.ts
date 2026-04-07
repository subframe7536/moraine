import { readFileSync } from 'node:fs'
import path from 'node:path'

import MarkdownIt from 'markdown-it'
import { mergeConfig } from 'vite'

import { loadComponentApiDoc } from '../api-doc/load'
import { resolveDocsPageContext, toImportPath } from '../core/paths'
import { toKebabCase, toSingleQuoted } from '../core/strings'

import { parseSegments } from './directives'
import { parseFrontmatter } from './frontmatter'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from './shared'
import type { CompileMarkdownOptions, MarkdownHighlightLang, ParsedSegment } from './types'

const MARKDOWN_LANG_ALIASES: Record<string, MarkdownHighlightLang> = {
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  tsx: 'tsx',
  ts: 'tsx',
  typescript: 'tsx',
  jsx: 'tsx',
  css: 'css',
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  javascript: 'javascript',
}

interface ExampleImport {
  componentAlias: string
  codeAlias: string
  sourcePath: string
  exportName: string
}

interface SegmentLiteral {
  code: string
  importSpec?: ExampleImport
  onThisPageEntries?: OnThisPageEntryLiteral[]
}

interface CodeTabItemLiteral {
  label: string
  value: string
  html: string
}

interface OnThisPageEntryLiteral {
  id: string
  label: string
  level: number
}

interface TocInheritedGroup {
  from: string
  props: unknown[]
}

interface TocApiDocShape {
  component: { key: string; name: string; sourcePath?: string; description?: string }
  slots: unknown[]
  props: { own: unknown[]; inherited: TocInheritedGroup[] }
  items?: unknown
}

const KOBALTE_COMPONENT_DOCS_BASE_URL = 'https://kobalte.dev/docs/core/components'
const KOBALTE_IGNORED_MODULES = new Set(['popper', 'polymorphic'])
const KOBALTE_IMPORT_PATTERN = /from\s+['"]@kobalte\/core\/([^'"]+)['"]/g

function normalizeMarkdownLang(value: string): MarkdownHighlightLang | null {
  const key = value.trim().toLowerCase()
  if (!key) {
    return null
  }
  return MARKDOWN_LANG_ALIASES[key] ?? null
}

function toAnchorSlug(value: string): string {
  return toKebabCase(value) || 'section'
}

function createMarkdown(
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): MarkdownIt {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(source, info) {
      if (!highlightCode) {
        return ''
      }

      const langToken = info.trim().split(/\s+/g)[0] ?? ''
      const lang = normalizeMarkdownLang(langToken)
      if (!lang) {
        return ''
      }

      return highlightCode(source, lang) ?? ''
    },
  })

  const headingSlugCounter = new Map<string, number>()

  const createHeadingSlug = (headingText: string) => {
    const baseSlug = toAnchorSlug(headingText)
    const currentCount = headingSlugCounter.get(baseSlug) ?? 0
    const nextCount = currentCount + 1
    headingSlugCounter.set(baseSlug, nextCount)
    return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
  }

  const defaultHeadingOpenRule = markdown.renderer.rules.heading_open
  markdown.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    const inlineToken = tokens[idx + 1]
    const headingText = inlineToken?.type === 'inline' ? inlineToken.content : ''
    const slug = createHeadingSlug(headingText)
    const level = Number.parseInt(token.tag.replace('h', ''), 10)
    const onThisPageEntries =
      typeof env === 'object' && env !== null && 'onThisPageEntries' in env
        ? (env as { onThisPageEntries?: OnThisPageEntryLiteral[] }).onThisPageEntries
        : undefined
    if (
      Array.isArray(onThisPageEntries) &&
      Number.isFinite(level) &&
      level >= 2 &&
      level <= 5 &&
      headingText.trim()
    ) {
      onThisPageEntries.push({
        id: slug,
        label: headingText.trim(),
        level: level - 1,
      })
    }

    token.attrSet('id', slug)
    token.attrJoin('class', MARKDOWN_ANCHOR_HEADING_CLASS)
    token.attrJoin('class', `docs-h${level}`)
    token.meta = { ...token.meta, anchorSlug: slug }

    if (defaultHeadingOpenRule) {
      return defaultHeadingOpenRule(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  const defaultHeadingCloseRule = markdown.renderer.rules.heading_close
  markdown.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    const openToken = tokens[idx - 2]
    const anchorSlug =
      typeof openToken?.meta?.anchorSlug === 'string' ? openToken.meta.anchorSlug : ''
    const anchorHtml = anchorSlug
      ? `<a class="${MARKDOWN_ANCHOR_LINK_CLASS}" href="#${anchorSlug}" aria-label="${DOCS_HEADING_ANCHOR_ARIA_LABEL}">#</a>`
      : ''

    if (defaultHeadingCloseRule) {
      return `${anchorHtml}${defaultHeadingCloseRule(tokens, idx, options, env, self)}`
    }

    return `${anchorHtml}${self.renderToken(tokens, idx, options)}`
  }

  // Match our markdown-it table output to the custom PropsTable look.
  // (Rounded wrapper, header typography, row borders/hover.)
  const defaultTableOpenRule = markdown.renderer.rules.table_open
  markdown.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    token.attrSet('class', 'text-sm m-0 w-full border-collapse')

    const openHtml = defaultTableOpenRule
      ? defaultTableOpenRule(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)

    return `<div class="my-6 b-1 b-border rounded-lg overflow-x-auto">${openHtml}`
  }

  const defaultTableCloseRule = markdown.renderer.rules.table_close
  markdown.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    const closeHtml = defaultTableCloseRule
      ? defaultTableCloseRule(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)

    return `${closeHtml}</div>`
  }

  const DEFAULT_TABLE_THEAD_TR_CLASS =
    'text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase'
  const DEFAULT_TABLE_TBODY_TR_CLASS = 'b-t b-border hover:bg-muted/50'
  const DEFAULT_TABLE_TH_CLASS = 'font-medium px-3 py-2'
  const DEFAULT_TABLE_TD_CLASS = 'px-3 py-2'

  const isInsideThead = (allTokens: Array<{ type?: string }>, trOpenIdx: number) => {
    for (let i = trOpenIdx - 1; i >= 0; i -= 1) {
      const type = allTokens[i]?.type
      if (type === 'thead_open') {
        return true
      }
      if (type === 'tbody_open') {
        return false
      }
      if (type === 'table_open') {
        return false
      }
    }
    return false
  }

  const defaultTrOpenRule = markdown.renderer.rules.tr_open
  markdown.renderer.rules.tr_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    const useThead = isInsideThead(tokens, idx)
    token.attrJoin('class', useThead ? DEFAULT_TABLE_THEAD_TR_CLASS : DEFAULT_TABLE_TBODY_TR_CLASS)

    if (defaultTrOpenRule) {
      return defaultTrOpenRule(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  const defaultThOpenRule = markdown.renderer.rules.th_open
  markdown.renderer.rules.th_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    token.attrJoin('class', DEFAULT_TABLE_TH_CLASS)
    if (defaultThOpenRule) {
      return defaultThOpenRule(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  const defaultTdOpenRule = markdown.renderer.rules.td_open
  markdown.renderer.rules.td_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    token.attrJoin('class', DEFAULT_TABLE_TD_CLASS)
    if (defaultTdOpenRule) {
      return defaultTdOpenRule(tokens, idx, options, env, self)
    }
    return self.renderToken(tokens, idx, options)
  }

  // --- Docs prose shortcut class injection ---
  // Widget <section> elements (rendered as SolidJS JSX) never go through
  // this pipeline, so they are automatically excluded from these styles.

  markdown.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-p')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-ul')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.ordered_list_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-ol')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-li')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-a')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.code_inline = (tokens, idx) => {
    const token = tokens[idx]!
    return `<code class="docs-inline-code">${markdown.utils.escapeHtml(token.content)}</code>`
  }

  markdown.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-blockquote')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.strong_open = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-strong')
    return self.renderToken(tokens, idx, options)
  }

  markdown.renderer.rules.hr = (tokens, idx, options, env, self) => {
    tokens[idx]!.attrJoin('class', 'docs-hr')
    return self.renderToken(tokens, idx, options)
  }

  const defaultFenceRule = markdown.renderer.rules.fence
  markdown.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const output = defaultFenceRule
      ? defaultFenceRule(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
    // Plain fallback: `<pre>` with no attributes.
    const plainReplaced = output.replace(/^<pre>/, `<pre class="docs-pre">`)
    if (plainReplaced !== output) {
      return plainReplaced
    }
    // Shiki output: `<pre class="shiki ...">` — wrap in a styled container so it
    // gets the same rounded border and font-size as ShikiCodeBlock.
    const preWithPadding = output.replace(/(<pre\s[^>]*class=")/, `$1text-sm m-0 p-4 `)
    return `<div class="docs-code-block"><div class="docs-code-block-inner">${preWithPadding}</div></div>`
  }

  return markdown
}

const BLOCK_DESCRIPTION_PATTERN = /```|(^|\n)\s*>|\n\s*\n|(^|\n)\s*(?:[-*+]|\d+\.)\s+/m

function renderDescriptionMarkdown(value: string, markdown: MarkdownIt): string {
  const text = value.trim()
  if (!text) {
    return ''
  }

  return BLOCK_DESCRIPTION_PATTERN.test(text)
    ? markdown.render(text).trim()
    : markdown.renderInline(text)
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function renderDescriptionField<T extends Record<string, unknown>>(
  input: T,
  markdown: MarkdownIt,
): T {
  if (typeof input.description !== 'string') {
    return input
  }

  return {
    ...input,
    description: renderDescriptionMarkdown(input.description, markdown),
  }
}

function renderPropDescriptions(props: unknown, markdown: MarkdownIt): unknown[] {
  if (!Array.isArray(props)) {
    return []
  }

  return props.map((prop) => {
    const record = asObjectRecord(prop)
    return record ? renderDescriptionField(record, markdown) : prop
  })
}

function renderItemsDescriptions(items: unknown, markdown: MarkdownIt): unknown {
  const record = asObjectRecord(items)
  if (!record) {
    return items
  }

  return {
    ...renderDescriptionField(record, markdown),
    props: renderPropDescriptions(record.props, markdown),
  }
}

function renderApiDocDescriptions(apiDoc: unknown, markdown: MarkdownIt): unknown {
  const record = asObjectRecord(apiDoc)
  if (!record) {
    return apiDoc
  }

  const component = asObjectRecord(record.component)
  const props = asObjectRecord(record.props)

  const own = renderPropDescriptions(props?.own, markdown)
  const inherited = Array.isArray(props?.inherited)
    ? props!.inherited
        .map((group) => {
          const groupRecord = asObjectRecord(group)
          if (!groupRecord || typeof groupRecord.from !== 'string') {
            return null
          }
          groupRecord.props = renderPropDescriptions(groupRecord.props, markdown)
          return groupRecord
        })
        .filter(Boolean)
    : []

  return {
    ...record,
    component: component ? renderDescriptionField(component, markdown) : record.component,
    props: {
      ...props,
      own,
      inherited,
    },
    items: renderItemsDescriptions(record.items, markdown),
  }
}

function renderApiReferenceDescriptions(
  model: {
    sections: Array<{
      id: string
      heading: string
      description?: string
      badges?: string[]
      props: unknown[]
      groups?: Array<{ description: string; props: unknown[] }>
    }>
  } | null,
  markdown: MarkdownIt,
) {
  if (!model) {
    return model
  }

  return {
    ...model,
    sections: model.sections.map((section) => ({
      ...renderDescriptionField(section, markdown),
      props: renderPropDescriptions(section.props, markdown),
      groups: section.groups?.map((group) => ({
        ...renderDescriptionField(group, markdown),
        props: renderPropDescriptions(group.props, markdown),
      })),
    })),
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function createPlainCodeBlockHtml(source: string): string {
  return `<pre><code>${escapeHtml(source)}</code></pre>`
}

function createCodeTabsItems(
  packageName: string,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): CodeTabItemLiteral[] {
  return [
    { label: 'bun', value: 'bun', source: `bun add ${packageName}` },
    { label: 'pnpm', value: 'pnpm', source: `pnpm add ${packageName}` },
    { label: 'npm', value: 'npm', source: `npm i ${packageName}` },
  ].map((command) => ({
    label: command.label,
    value: command.value,
    html: highlightCode?.(command.source, 'bash') ?? createPlainCodeBlockHtml(command.source),
  }))
}

function asTocApiDoc(value: unknown): TocApiDocShape | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const doc = value as Record<string, unknown>
  if (!doc.component || typeof doc.component !== 'object') {
    return null
  }
  const component = doc.component as Record<string, unknown>
  if (typeof component.key !== 'string' || typeof component.name !== 'string') {
    return null
  }
  if (!Array.isArray(doc.slots) || !doc.props || typeof doc.props !== 'object') {
    return null
  }
  const props = doc.props as Record<string, unknown>
  if (!Array.isArray(props.own) || !Array.isArray(props.inherited)) {
    return null
  }
  const inherited = props.inherited
    .map((group) => {
      if (!group || typeof group !== 'object') {
        return null
      }
      const inheritedGroup = group as Record<string, unknown>
      if (typeof inheritedGroup.from !== 'string') {
        return null
      }
      return {
        from: inheritedGroup.from,
        props: Array.isArray(inheritedGroup.props) ? inheritedGroup.props : [],
      }
    })
    .filter((group): group is TocInheritedGroup => Boolean(group))
  return {
    component: {
      key: component.key,
      name: component.name,
      sourcePath: typeof component.sourcePath === 'string' ? component.sourcePath : undefined,
    },
    slots: doc.slots,
    props: { own: props.own, inherited },
    items: doc.items,
  }
}

function inferKobalteComponentDocsHref(
  projectRoot: string | undefined,
  sourcePath: string | undefined,
): string | null {
  if (!projectRoot || !sourcePath) {
    return null
  }

  const absoluteSourcePath = path.join(projectRoot, sourcePath)
  let sourceCode = ''
  try {
    sourceCode = readFileSync(absoluteSourcePath, 'utf8')
  } catch {
    return null
  }

  for (const match of sourceCode.matchAll(KOBALTE_IMPORT_PATTERN)) {
    const rawModulePath = match[1]
    const moduleName = rawModulePath?.split('/')[0]
    if (!moduleName || KOBALTE_IGNORED_MODULES.has(moduleName)) {
      continue
    }

    return `${KOBALTE_COMPONENT_DOCS_BASE_URL}/${moduleName}`
  }

  return null
}

function extractHeaderApiDocOverride(segments: ParsedSegment[]): Record<string, unknown> | null {
  for (const segment of segments) {
    if (segment.type !== 'docs-header') {
      continue
    }

    if (!segment.props) {
      return null
    }

    const apiDocOverride = segment.props.apiDocOverride
    if (!apiDocOverride || typeof apiDocOverride !== 'object' || Array.isArray(apiDocOverride)) {
      return null
    }

    return apiDocOverride as Record<string, unknown>
  }

  return null
}

function buildSegmentLiterals(
  segments: ParsedSegment[],
  renderMarkdown: (source: string) => { html: string; onThisPageEntries: OnThisPageEntryLiteral[] },
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): SegmentLiteral[] {
  let exampleIndex = 0

  return segments.map((segment) => {
    if (segment.type === 'markdown') {
      const renderedMarkdown = renderMarkdown(segment.text)
      return {
        code: `{ type: 'markdown', html: ${JSON.stringify(renderedMarkdown.html.trim())} }`,
        onThisPageEntries: renderedMarkdown.onThisPageEntries,
      }
    }

    if (
      segment.type === 'docs-header' ||
      segment.type === 'docs-api-reference' ||
      segment.type === 'intro-cards' ||
      segment.type === 'intro-components' ||
      segment.type === 'toast-hosts'
    ) {
      return {
        code: `{ type: ${JSON.stringify(segment.type)}${
          segment.props ? `, props: ${JSON.stringify(segment.props)}` : ''
        } }`,
      }
    }

    if (segment.type === 'code-tabs') {
      return {
        code: `{ type: 'code-tabs', items: ${JSON.stringify(
          createCodeTabsItems(segment.packageName, highlightCode),
        )} }`,
      }
    }

    const componentAlias = `ExampleComponent${exampleIndex}`
    const codeAlias = `ExampleCode${exampleIndex}`
    exampleIndex += 1

    const sourcePath = segment.source

    return {
      code: `{ type: 'example', component: ${componentAlias}, code: ${codeAlias} }`,
      importSpec: {
        componentAlias,
        codeAlias,
        sourcePath,
        exportName: segment.name,
      },
    }
  })
}

export function compileMarkdownPage(
  markdownSource: string,
  id: string,
  options: CompileMarkdownOptions = {},
): string {
  const idWithoutQuery = id.split('?')[0] ?? id
  const page = resolveDocsPageContext(idWithoutQuery)
  const parsedFrontmatter = parseFrontmatter(markdownSource, idWithoutQuery)
  const segments = parseSegments(parsedFrontmatter.content, idWithoutQuery, {
    directiveAliases: options.directiveAliases,
  })
  const widgetApiDocOverride = extractHeaderApiDocOverride(segments)
  const markdown = createMarkdown(options.highlightCode)
  const hasDocsApiReferenceWidget = segments.some(
    (segment) => segment.type === 'docs-api-reference',
  )
  const segmentLiterals = buildSegmentLiterals(
    segments,
    (source) => {
      const onThisPageEntries: OnThisPageEntryLiteral[] = []
      return {
        html: markdown.render(source, { onThisPageEntries }),
        onThisPageEntries,
      }
    },
    options.highlightCode,
  )
  const runtimePath = toImportPath(idWithoutQuery, path.join(page.docsRoot, 'components/markdown'))

  const importLines = [`import { Markdown } from ${toSingleQuoted(runtimePath)}`]
  const segmentCodes: string[] = []

  for (const literal of segmentLiterals) {
    if (!literal.importSpec) {
      segmentCodes.push(literal.code)
      continue
    }

    importLines.push(
      literal.importSpec.exportName === 'default'
        ? `import ${literal.importSpec.componentAlias} from ${toSingleQuoted(literal.importSpec.sourcePath)}`
        : `import { ${literal.importSpec.exportName} as ${literal.importSpec.componentAlias} } from ${toSingleQuoted(
            literal.importSpec.sourcePath,
          )}`,
    )

    importLines.push(
      `import ${literal.importSpec.codeAlias} from ${toSingleQuoted(
        `${literal.importSpec.sourcePath}?example-source&name=${encodeURIComponent(
          literal.importSpec.exportName,
        )}`,
      )}`,
    )

    segmentCodes.push(literal.code)
  }

  const loadedApiDoc = options.projectRoot
    ? loadComponentApiDoc(options.projectRoot, page.pageKey)
    : null

  const mergedApiDoc =
    widgetApiDocOverride && loadedApiDoc
      ? mergeConfig(loadedApiDoc, widgetApiDocOverride)
      : (loadedApiDoc ?? widgetApiDocOverride)
  const tocApiDoc = asTocApiDoc(mergedApiDoc)
  const renderedApiDoc = renderApiDocDescriptions(mergedApiDoc, markdown)

  const shouldExposeComponentKey = Boolean(mergedApiDoc)
  const upstreamHref = inferKobalteComponentDocsHref(
    options.projectRoot,
    tocApiDoc?.component.sourcePath,
  )
  const onThisPageEntries: OnThisPageEntryLiteral[] = []
  const hasMainSlots = Boolean(tocApiDoc?.slots.length)
  const hasMainProps = Boolean(tocApiDoc?.props.own.length)
  const hasMainItems = Boolean(tocApiDoc?.items)
  const hasMainInherited = Boolean(tocApiDoc?.props.inherited.length)
  const hasMainApiReference = hasMainSlots || hasMainProps || hasMainItems || hasMainInherited

  const apiReferenceModel =
    tocApiDoc && hasDocsApiReferenceWidget && hasMainApiReference
      ? (() => {
          const sections: Array<{
            id: string
            heading: string
            description?: string
            badges?: string[]
            props: unknown[]
            groups?: Array<{ description: string; props: unknown[] }>
          }> = []

          if (hasMainSlots) {
            sections.push({
              id: 'api-slots',
              heading: 'Slots',
              badges: tocApiDoc.slots as string[],
              props: [],
            })
          }

          if (hasMainProps) {
            sections.push({
              id: 'api-props',
              heading: 'Props',
              props: tocApiDoc.props.own,
            })
          }

          if (hasMainItems) {
            const itemsDoc = tocApiDoc.items as
              | { description?: string; props?: unknown[] }
              | undefined
            sections.push({
              id: 'api-items',
              heading: 'Items',
              description: itemsDoc?.description,
              props: itemsDoc?.props ?? [],
            })
          }

          if (hasMainInherited) {
            sections.push({
              id: 'api-inherited',
              heading: 'Inherited',
              props: [],
              groups: tocApiDoc.props.inherited.map((group) => ({
                description: `From ${group.from}`,
                props: group.props,
              })),
            })
          }

          return { sections }
        })()
      : null
  const renderedApiReferenceModel = renderApiReferenceDescriptions(apiReferenceModel, markdown)
  for (const segment of segmentLiterals) {
    if (segment.onThisPageEntries) {
      onThisPageEntries.push(...segment.onThisPageEntries)
    }
  }
  onThisPageEntries.push({
    id: 'api-ref',
    label: 'API Reference',
    level: 1,
  })
  if (hasDocsApiReferenceWidget && renderedApiReferenceModel) {
    for (const section of renderedApiReferenceModel.sections) {
      onThisPageEntries.push({
        id: section.id,
        label: section.heading,
        level: 2,
      })
    }
  }
  const configFields = [
    shouldExposeComponentKey ? `componentKey: ${JSON.stringify(page.pageKey)}` : '',
    Object.keys(parsedFrontmatter.data).length > 0
      ? `frontmatter: ${JSON.stringify(parsedFrontmatter.data)}`
      : '',
    renderedApiDoc ? `apiDoc: ${JSON.stringify(renderedApiDoc)}` : '',
    renderedApiReferenceModel ? `apiReference: ${JSON.stringify(renderedApiReferenceModel)}` : '',
    upstreamHref ? `upstreamHref: ${JSON.stringify(upstreamHref)}` : '',
    `onThisPageEntries: ${JSON.stringify(onThisPageEntries)}`,
    'segments',
  ].filter(Boolean)

  return [
    ...importLines,
    '',
    `const segments = [${segmentCodes.join(', ')}]`,
    '',
    'export default function MarkdownPage() {',
    `  return Markdown({ ${configFields.join(', ')} })`,
    '}',
    '',
  ].join('\n')
}
