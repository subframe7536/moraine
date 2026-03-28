import { readFileSync } from 'node:fs'
import path from 'node:path'

import MarkdownIt from 'markdown-it'
import { mergeConfig } from 'vite'

import { loadComponentApiDoc } from '../api-doc/load'
import { resolveDocsPageContext, toImportPath } from '../core/paths'
import { toKebabCase, toSingleQuoted } from '../core/strings'

import { MARKDOWN_ANCHOR_HEADING_CLASS, MARKDOWN_ANCHOR_LINK_CLASS } from './const'
import { parseSegments } from './directives'
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
}

interface TocApiDocShape {
  component: { key: string; name: string; sourcePath?: string }
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
    const token = tokens[idx]
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
      ? `<a class="${MARKDOWN_ANCHOR_LINK_CLASS}" href="#${anchorSlug}" aria-label="Link to this section">#</a>`
      : ''

    if (defaultHeadingCloseRule) {
      return `${anchorHtml}${defaultHeadingCloseRule(tokens, idx, options, env, self)}`
    }

    return `${anchorHtml}${self.renderToken(tokens, idx, options)}`
  }

  return markdown
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
      return { from: inheritedGroup.from }
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
    if (segment.type !== 'widget' || segment.widgetName !== 'docs-header') {
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

    if (segment.type === 'widget') {
      return {
        code: `{ type: 'widget', widgetName: ${JSON.stringify(segment.widgetName)}${
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

    return {
      code: `{ type: 'example', component: ${componentAlias}, code: ${codeAlias} }`,
      importSpec: {
        componentAlias,
        codeAlias,
        sourcePath: segment.source,
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
  const segments = parseSegments(markdownSource, idWithoutQuery)
  const widgetApiDocOverride = extractHeaderApiDocOverride(segments)
  const markdown = createMarkdown(options.highlightCode)
  const hasDocsApiReferenceWidget = segments.some(
    (segment) => segment.type === 'widget' && segment.widgetName === 'docs-api-reference',
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

  const shouldExposeComponentKey = Boolean(mergedApiDoc)
  const kobalteHref = inferKobalteComponentDocsHref(
    options.projectRoot,
    tocApiDoc?.component.sourcePath,
  )
  const onThisPageEntries: OnThisPageEntryLiteral[] = []
  const hasMainSlots = Boolean(tocApiDoc?.slots.length)
  const hasMainProps = Boolean(tocApiDoc?.props.own.length)
  const hasMainItems = Boolean(tocApiDoc?.items)
  const hasMainInherited = Boolean(tocApiDoc?.props.inherited.length)
  const hasMainApiReference = hasMainSlots || hasMainProps || hasMainItems || hasMainInherited
  for (const segment of segmentLiterals) {
    if (segment.onThisPageEntries) {
      onThisPageEntries.push(...segment.onThisPageEntries)
    }
  }
  if (hasDocsApiReferenceWidget && hasMainApiReference) {
    if (hasMainSlots) {
      onThisPageEntries.push({ id: 'api-slots', label: 'Slots', level: 2 })
    }
    if (hasMainProps) {
      onThisPageEntries.push({ id: 'api-props', label: 'Props', level: 2 })
    }
    if (hasMainItems) {
      onThisPageEntries.push({ id: 'api-items', label: 'Items', level: 2 })
    }
    if (hasMainInherited) {
      onThisPageEntries.push({ id: 'api-inherited', label: 'Inherited', level: 2 })
    }
  }
  const configFields = [
    shouldExposeComponentKey ? `componentKey: ${JSON.stringify(page.pageKey)}` : '',
    mergedApiDoc ? `apiDoc: ${JSON.stringify(mergedApiDoc)}` : '',
    kobalteHref ? `kobalteHref: ${JSON.stringify(kobalteHref)}` : '',
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
