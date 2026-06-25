import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { defineHastPlugin, defineMdastPlugin, markdownToHtml, mdxToJs, mdxToMdast } from 'satteri'
import type { Data, HastNode } from 'satteri'
import ts from 'typescript'
import { mergeConfig } from 'vite'
import YAML from 'yaml'

import { loadComponentApiDoc } from '../api-doc/load'
import { resolveDocsPageContext, toImportPath } from '../core/paths'
import { toKebabCase, toSingleQuoted } from '../core/strings'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from './descriptions'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from './shared'
import type { CompileMarkdownOptions, FrontmatterData, MarkdownHighlightLang } from './types'

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

const DOCS_MDX_FEATURES = {
  gfm: true,
  frontmatter: true,
  smartPunctuation: true,
}

const DEFAULT_TABLE_THEAD_TR_CLASS =
  'text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase'
const DEFAULT_TABLE_TBODY_TR_CLASS = 'b-t b-border hover:bg-muted/50'
const DEFAULT_TABLE_TH_CLASS = 'font-medium px-3 py-2'
const DEFAULT_TABLE_TD_CLASS = 'px-3 py-2'

const BLOCK_DESCRIPTION_PATTERN = /```|(^|\n)\s*>|\n\s*\n|(^|\n)\s*(?:[-*+]|\d+\.)\s+/m

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

interface ScannedMdxPage {
  codeTabsPackages: string[]
  docsHeaderProps: Record<string, unknown> | null
  hasDocsApiReference: boolean
  hasDocsApiReferenceHeading: boolean
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

interface TocSlotDoc {
  name: string
  description?: string
}

interface ApiAttributeDoc {
  name: string
  required: false
  type: string
  description: string
}

interface SourceSlotReference {
  name: string
  description?: string
  cssVariables: ApiAttributeDoc[]
  dataAttributes: ApiAttributeDoc[]
  ariaAttributes: ApiAttributeDoc[]
}

interface SourceAttributeReference {
  aria: ApiAttributeDoc[]
  data: ApiAttributeDoc[]
  slots: SourceSlotReference[]
}

function normalizeMarkdownLang(value: string | null | undefined): MarkdownHighlightLang | null {
  const key = value?.trim().toLowerCase() ?? ''
  if (!key) {
    return null
  }
  return MARKDOWN_LANG_ALIASES[key] ?? null
}

function toAnchorSlug(value: string): string {
  return toKebabCase(value) || 'section'
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

function getNodeProperties(node: HastNode): Record<string, unknown> {
  if (node.type !== 'element') {
    return {}
  }
  return (node.properties ?? {}) as Record<string, unknown>
}

function getClassValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join(' ')
  }
  return ''
}

function appendClass(node: HastNode, className: string): string {
  const current = getClassValue(getNodeProperties(node).class)
  return current ? `${current} ${className}` : className
}

function createDocsHastPlugin(onThisPageEntries?: OnThisPageEntryLiteral[]) {
  const headingSlugCounter = new Map<string, number>()

  const createHeadingSlug = (headingText: string) => {
    const baseSlug = toAnchorSlug(headingText)
    const currentCount = headingSlugCounter.get(baseSlug) ?? 0
    const nextCount = currentCount + 1
    headingSlugCounter.set(baseSlug, nextCount)
    return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
  }

  return defineHastPlugin({
    name: 'moraine-docs-hast',
    element: [
      {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        visit(node, ctx) {
          const level = Number.parseInt(node.tagName.replace('h', ''), 10)
          const headingText = ctx.textContent(node).trim()
          const slug = createHeadingSlug(headingText)

          ctx.setProperty(node, 'id', slug)
          ctx.setProperty(
            node,
            'class',
            appendClass(node, `${MARKDOWN_ANCHOR_HEADING_CLASS} docs-h${level}`),
          )

          if (level >= 2 && level <= 5 && headingText) {
            onThisPageEntries?.push({
              id: slug,
              label: headingText,
              level: level - 1,
            })
          }

          ctx.appendChild(node, {
            type: 'element',
            tagName: 'a',
            properties: {
              class: MARKDOWN_ANCHOR_LINK_CLASS,
              href: `#${slug}`,
              'aria-label': DOCS_HEADING_ANCHOR_ARIA_LABEL,
            },
            children: [{ type: 'text', value: '#' }],
          })
        },
      },
      {
        filter: ['p'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-p'))
        },
      },
      {
        filter: ['ul'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-ul'))
        },
      },
      {
        filter: ['ol'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-ol'))
        },
      },
      {
        filter: ['li'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-li'))
        },
      },
      {
        filter: ['a'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-a'))
        },
      },
      {
        filter: ['code'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-inline-code'))
        },
      },
      {
        filter: ['blockquote'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-blockquote'))
        },
      },
      {
        filter: ['strong'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-strong'))
        },
      },
      {
        filter: ['hr'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-hr'))
        },
      },
      {
        filter: ['table'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'text-sm m-0 w-full border-collapse'))
          ctx.wrapNode(node, {
            type: 'element',
            tagName: 'div',
            properties: {
              class: 'my-6 b-1 b-border rounded-lg overflow-x-auto',
            },
            children: [],
          })
        },
      },
      {
        filter: ['tr'],
        visit(node, ctx) {
          const parent = ctx.parent(node)
          const isThead =
            parent?.type === 'element' && 'tagName' in parent && parent.tagName === 'thead'
          ctx.setProperty(
            node,
            'class',
            appendClass(
              node,
              isThead ? DEFAULT_TABLE_THEAD_TR_CLASS : DEFAULT_TABLE_TBODY_TR_CLASS,
            ),
          )
        },
      },
      {
        filter: ['th'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, DEFAULT_TABLE_TH_CLASS))
        },
      },
      {
        filter: ['td'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, DEFAULT_TABLE_TD_CLASS))
        },
      },
    ],
  })
}

function createDocsCodePlugin(
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
) {
  return defineMdastPlugin({
    name: 'moraine-docs-code',
    code(node) {
      const lang = normalizeMarkdownLang(node.lang)
      const html = lang ? (highlightCode?.(node.value, lang) ?? null) : null
      return {
        type: 'mdxJsxFlowElement',
        name: 'ShikiCodeBlock',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'html',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              value: JSON.stringify(html ?? createPlainCodeBlockHtml(node.value)),
            },
          },
        ],
        children: [],
      }
    },
  })
}

function assertSyncResult<T>(result: T | Promise<T>): T {
  if (result instanceof Promise) {
    throw new TypeError('[docs-mdx] async Satteri plugins are not supported in docs compile')
  }
  return result
}

function renderMarkdownHtml(
  source: string,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): string {
  const result = assertSyncResult(
    markdownToHtml(source, {
      features: DOCS_MDX_FEATURES,
      mdastPlugins: [createDocsCodePlugin(highlightCode)],
      hastPlugins: [createDocsHastPlugin()],
    }),
  )
  return result.html
}

function stripParagraphWrapper(html: string): string {
  const trimmed = html.trim()
  const match = trimmed.match(/^<p class="docs-p">([\s\S]*)<\/p>$/)
  return match?.[1] ?? trimmed
}

function renderDescriptionMarkdown(
  value: string,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): string {
  const text = value.trim()
  if (!text) {
    return ''
  }

  const html = renderMarkdownHtml(text, highlightCode)
  return BLOCK_DESCRIPTION_PATTERN.test(text) ? html.trim() : stripParagraphWrapper(html)
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function renderDescriptionField<T extends Record<string, unknown>>(
  input: T,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): T {
  if (typeof input.description !== 'string') {
    return input
  }

  return {
    ...input,
    description: renderDescriptionMarkdown(input.description, highlightCode),
  }
}

function renderPropDescriptions(
  props: unknown,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): unknown[] {
  if (!Array.isArray(props)) {
    return []
  }

  return props.map((prop) => {
    const record = asObjectRecord(prop)
    return record ? renderDescriptionField(record, highlightCode) : prop
  })
}

function renderItemsDescriptions(
  items: unknown,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): unknown {
  const record = asObjectRecord(items)
  if (!record) {
    return items
  }

  return {
    ...renderDescriptionField(record, highlightCode),
    props: renderPropDescriptions(record.props, highlightCode),
  }
}

function renderApiDocDescriptions(
  apiDoc: unknown,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): unknown {
  const record = asObjectRecord(apiDoc)
  if (!record) {
    return apiDoc
  }

  const component = asObjectRecord(record.component)
  const props = asObjectRecord(record.props)

  const own = renderPropDescriptions(props?.own, highlightCode)
  const inherited = Array.isArray(props?.inherited)
    ? props!.inherited
        .map((group) => {
          const groupRecord = asObjectRecord(group)
          if (!groupRecord || typeof groupRecord.from !== 'string') {
            return null
          }
          groupRecord.props = renderPropDescriptions(groupRecord.props, highlightCode)
          return groupRecord
        })
        .filter(Boolean)
    : []

  return {
    ...record,
    component: component ? renderDescriptionField(component, highlightCode) : record.component,
    props: {
      ...props,
      own,
      inherited,
    },
    items: renderItemsDescriptions(record.items, highlightCode),
  }
}

function renderApiReferenceDescriptions(
  model: {
    sections: Array<{
      id: string
      heading: string
      description?: string
      nameColumn?: string
      badges?: string[]
      props: unknown[]
      slots?: Array<{
        name: string
        cssVariables: unknown[]
        dataAttributes: unknown[]
        ariaAttributes: unknown[]
      }>
      groups?: Array<{ description: string; props: unknown[] }>
    }>
  } | null,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
) {
  if (!model) {
    return model
  }

  return {
    ...model,
    sections: model.sections.map((section) => ({
      ...renderDescriptionField(section, highlightCode),
      props: renderPropDescriptions(section.props, highlightCode),
      slots: section.slots?.map((slot) => ({
        ...renderDescriptionField(slot, highlightCode),
        cssVariables: renderPropDescriptions(slot.cssVariables, highlightCode),
        dataAttributes: renderPropDescriptions(slot.dataAttributes, highlightCode),
        ariaAttributes: renderPropDescriptions(slot.ariaAttributes, highlightCode),
      })),
      groups: section.groups?.map((group) => ({
        ...renderDescriptionField(group, highlightCode),
        props: renderPropDescriptions(group.props, highlightCode),
      })),
    })),
  }
}

function getJsxAttributeName(name: ts.JsxAttributeName): string | null {
  if (ts.isIdentifier(name) || ts.isJsxNamespacedName(name)) {
    return name.getText()
  }
  return null
}

function getJsxAttributeStaticValue(attribute: ts.JsxAttribute): string | null {
  const initializer = attribute.initializer
  if (!initializer) {
    return ''
  }
  if (ts.isStringLiteral(initializer)) {
    return initializer.text
  }
  if (
    ts.isJsxExpression(initializer) &&
    initializer.expression &&
    ts.isStringLiteralLike(initializer.expression)
  ) {
    return initializer.expression.text
  }
  return null
}

function getJsxAttributes(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
): ts.JsxAttribute[] {
  return node.attributes.properties.filter(ts.isJsxAttribute)
}

function getJsxTagName(tagName: ts.JsxTagNameExpression): string | null {
  if (ts.isIdentifier(tagName)) {
    return tagName.text
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    return tagName.name.text
  }
  return null
}

function resolveLocalImportPath(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) {
    return null
  }

  const basePath = path.resolve(path.dirname(importerPath), specifier)
  const candidates = [
    `${basePath}.tsx`,
    `${basePath}.ts`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
  ]

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {
      // Try the next source candidate.
    }
  }

  return null
}

function resolveReadableSourcePath(projectRoot: string, sourcePath: string): string | null {
  const absoluteSourcePath = path.join(projectRoot, sourcePath)
  const implementationBasePath = absoluteSourcePath.replace(/\.d\.(cts|mts|ts)$/, '')
  const candidates = [
    absoluteSourcePath,
    `${implementationBasePath}.tsx`,
    `${implementationBasePath}.ts`,
    `${implementationBasePath}.jsx`,
    `${implementationBasePath}.js`,
  ]

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

function getAttributeType(name: string): string {
  if (name === 'role' || name === 'aria-current' || name === 'aria-live') {
    return 'string'
  }
  if (name === 'data-slot' || name === 'data-size' || name === 'data-variant') {
    return 'string'
  }
  if (name.startsWith('data-')) {
    return 'string | undefined'
  }
  return 'boolean | string | undefined'
}

function createAttributeDoc(name: string): ApiAttributeDoc {
  const isAria = name === 'role' || name.startsWith('aria-')
  const descriptions = isAria ? ARIA_ATTRIBUTE_DESCRIPTIONS : DATA_ATTRIBUTE_DESCRIPTIONS
  return {
    name,
    required: false,
    type: getAttributeType(name),
    description:
      descriptions[name] ??
      (isAria
        ? 'Accessibility attribute forwarded by the rendered component.'
        : 'State or slot attribute exposed for styling hooks and selectors.'),
  }
}

function createCssVariableDoc(name: string): ApiAttributeDoc {
  return {
    name,
    required: false,
    type: 'string',
    description: 'CSS custom property exposed by this slot.',
  }
}

function createEmptySlotReference(slot: TocSlotDoc): SourceSlotReference {
  return {
    name: slot.name,
    description: slot.description,
    cssVariables: [],
    dataAttributes: [],
    ariaAttributes: [],
  }
}

function extractSourceAttributeReference(
  projectRoot: string | undefined,
  sourcePath: string | undefined,
): SourceAttributeReference {
  if (!projectRoot || !sourcePath) {
    return { aria: [], data: [], slots: [] }
  }

  const ariaNames = new Set<string>()
  const dataNames = new Set<string>()
  const slotReferenceByName = new Map<
    string,
    {
      cssVariables: Set<string>
      dataAttributes: Set<string>
      ariaAttributes: Set<string>
    }
  >()
  const visited = new Set<string>()

  const getSlotReference = (slotName: string) => {
    let reference = slotReferenceByName.get(slotName)
    if (!reference) {
      reference = {
        cssVariables: new Set<string>(),
        dataAttributes: new Set<string>(),
        ariaAttributes: new Set<string>(),
      }
      slotReferenceByName.set(slotName, reference)
    }
    return reference
  }

  const collectFromSource = (absoluteSourcePath: string) => {
    if (visited.has(absoluteSourcePath)) {
      return
    }
    visited.add(absoluteSourcePath)

    let sourceCode = ''
    try {
      sourceCode = readFileSync(absoluteSourcePath, 'utf8')
    } catch {
      return
    }

    const sourceFile = ts.createSourceFile(
      absoluteSourcePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const localComponentImports = new Map<string, string>()
    const usedLocalComponents = new Set<string>()

    for (const statement of sourceFile.statements) {
      if (ts.isExportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier
        if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
          const resolvedPath = resolveLocalImportPath(absoluteSourcePath, moduleSpecifier.text)
          if (resolvedPath) {
            collectFromSource(resolvedPath)
          }
        }
        continue
      }

      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue
      }
      const resolvedPath = resolveLocalImportPath(
        absoluteSourcePath,
        statement.moduleSpecifier.text,
      )
      if (!resolvedPath) {
        continue
      }

      const clause = statement.importClause
      if (clause?.name) {
        localComponentImports.set(clause.name.text, resolvedPath)
      }

      const namedBindings = clause?.namedBindings
      if (!namedBindings || !ts.isNamedImports(namedBindings)) {
        continue
      }

      for (const element of namedBindings.elements) {
        localComponentImports.set(element.name.text, resolvedPath)
      }
    }

    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attributes = getJsxAttributes(node)
        const slotAttribute = attributes.find((attribute) => {
          const name = getJsxAttributeName(attribute.name)
          return name === 'data-slot' || name === 'slotName'
        })
        const slotName = slotAttribute ? getJsxAttributeStaticValue(slotAttribute) : null

        for (const attribute of attributes) {
          const name = getJsxAttributeName(attribute.name)
          if (!name) {
            continue
          }

          if (name === 'role' || name.startsWith('aria-')) {
            ariaNames.add(name)
            if (slotName) {
              getSlotReference(slotName).ariaAttributes.add(name)
            }
            continue
          }

          if (name.startsWith('data-')) {
            dataNames.add(name)
            if (slotName && name !== 'data-slot') {
              getSlotReference(slotName).dataAttributes.add(name)
            }
          }
        }

        if (slotName) {
          const slotReference = getSlotReference(slotName)
          for (const match of node.getText(sourceFile).matchAll(/--[A-Za-z_][\w-]*/g)) {
            slotReference.cssVariables.add(match[0])
          }
        }

        const tagName = getJsxTagName(node.tagName)
        if (tagName && /^[A-Z]/.test(tagName)) {
          usedLocalComponents.add(tagName)
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    for (const componentName of usedLocalComponents) {
      const importedPath = localComponentImports.get(componentName)
      if (importedPath) {
        collectFromSource(importedPath)
      }
    }
  }

  const resolvedSourcePath = resolveReadableSourcePath(projectRoot, sourcePath)
  if (!resolvedSourcePath) {
    return { aria: [], data: [], slots: [] }
  }

  collectFromSource(resolvedSourcePath)

  return {
    aria: [...ariaNames].sort().map(createAttributeDoc),
    data: [...dataNames].sort().map(createAttributeDoc),
    slots: [...slotReferenceByName.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, reference]) => ({
        name,
        cssVariables: [...reference.cssVariables].sort().map(createCssVariableDoc),
        dataAttributes: [...reference.dataAttributes].sort().map(createAttributeDoc),
        ariaAttributes: [...reference.ariaAttributes].sort().map(createAttributeDoc),
      })),
  }
}

function normalizeTocSlotDoc(value: unknown): TocSlotDoc | null {
  if (typeof value === 'string' && value.length > 0) {
    return { name: value }
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  if (typeof record.name !== 'string' || record.name.length === 0) {
    return null
  }

  return {
    name: record.name,
    description: typeof record.description === 'string' ? record.description : undefined,
  }
}

function createSlotReferenceDocs(
  slots: unknown[],
  sourceAttributes: SourceAttributeReference,
): SourceSlotReference[] {
  const sourceSlotByName = new Map(sourceAttributes.slots.map((slot) => [slot.name, slot]))

  return slots
    .map(normalizeTocSlotDoc)
    .filter((slot): slot is TocSlotDoc => Boolean(slot))
    .map((slot) => {
      const sourceSlot = sourceSlotByName.get(slot.name)
      const slotReference = sourceSlot ?? createEmptySlotReference(slot)

      if (slot.description || sourceSlot?.description) {
        slotReference.description = slot.description ?? sourceSlot?.description
      }

      return slotReference
    })
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

function evaluateStaticExpression(source: string, id: string, propName: string): unknown {
  const sourceFile = ts.createSourceFile(
    id,
    `const value = (${source});`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const statement = sourceFile.statements[0]
  if (
    !statement ||
    !ts.isVariableStatement(statement) ||
    !statement.declarationList.declarations[0]?.initializer
  ) {
    throw new Error(`[docs-mdx] ${propName} must be a static JSON-compatible expression in ${id}`)
  }

  const read = (node: ts.Expression): unknown => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node)
    ) {
      return read(node.expression)
    }
    if (ts.isStringLiteralLike(node)) {
      return node.text
    }
    if (ts.isNumericLiteral(node)) {
      return Number(node.text)
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return true
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return false
    }
    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return null
    }
    if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
      const value = Number(node.operand.text)
      return node.operator === ts.SyntaxKind.MinusToken ? -value : value
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((element) => {
        if (!ts.isExpression(element)) {
          throw new Error(`[docs-mdx] ${propName} arrays must contain static expressions in ${id}`)
        }
        return read(element)
      })
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result: Record<string, unknown> = {}
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(
            `[docs-mdx] ${propName} objects must use static property assignments in ${id}`,
          )
        }
        const name = property.name
        const key = ts.isIdentifier(name) || ts.isStringLiteralLike(name) ? name.text : null
        if (!key || !ts.isExpression(property.initializer)) {
          throw new Error(`[docs-mdx] ${propName} object keys must be static in ${id}`)
        }
        result[key] = read(property.initializer)
      }
      return result
    }
    throw new Error(`[docs-mdx] ${propName} must be a static JSON-compatible expression in ${id}`)
  }

  return read(statement.declarationList.declarations[0].initializer)
}

function getMdxAttributeValue(attribute: unknown, id: string): { name: string; value: unknown } {
  const record = asObjectRecord(attribute)
  if (!record || record.type !== 'mdxJsxAttribute' || typeof record.name !== 'string') {
    throw new Error(`[docs-mdx] unsupported MDX attribute in ${id}`)
  }

  if (!('value' in record) || record.value === null || record.value === undefined) {
    return { name: record.name, value: true }
  }

  if (typeof record.value === 'string') {
    return { name: record.name, value: record.value }
  }

  const expression = asObjectRecord(record.value)
  if (
    expression?.type === 'mdxJsxAttributeValueExpression' &&
    typeof expression.value === 'string'
  ) {
    return {
      name: record.name,
      value: evaluateStaticExpression(expression.value, id, record.name),
    }
  }

  throw new Error(`[docs-mdx] unsupported value for "${record.name}" in ${id}`)
}

function getStaticMdxAttributes(node: Record<string, unknown>, id: string) {
  const props: Record<string, unknown> = {}
  const attributes = Array.isArray(node.attributes) ? node.attributes : []
  for (const attribute of attributes) {
    const { name, value } = getMdxAttributeValue(attribute, id)
    props[name] = value
  }
  return props
}

function walkMdast(node: unknown, visit: (node: Record<string, unknown>) => void) {
  const record = asObjectRecord(node)
  if (!record) {
    return
  }

  visit(record)

  if (Array.isArray(record.children)) {
    for (const child of record.children) {
      walkMdast(child, visit)
    }
  }
}

function scanMdxPage(source: string, id: string): ScannedMdxPage {
  const tree = mdxToMdast(source, { features: DOCS_MDX_FEATURES })
  const codeTabsPackages: string[] = []
  let docsHeaderProps: Record<string, unknown> | null = null
  let hasDocsApiReference = false
  let hasDocsApiReferenceHeading = false

  walkMdast(tree, (node) => {
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') {
      return
    }

    if (typeof node.name !== 'string') {
      return
    }

    const props = getStaticMdxAttributes(node, id)

    if (node.name === 'DocsHeader') {
      docsHeaderProps ??= props
      return
    }

    if (node.name === 'DocsApiReference') {
      hasDocsApiReference = true
      return
    }

    if (node.name === 'HeadingWithAnchor' && props.id === 'api-ref') {
      hasDocsApiReferenceHeading = true
      return
    }

    if (node.name === 'Example') {
      throw new Error(
        `[docs-mdx] <Example /> is no longer supported in ${id}. Import demos with "?example" and render the Demo component instead.`,
      )
    }

    if (node.name === 'CodeTabs') {
      const packageName = props.package
      if (typeof packageName !== 'string' || !packageName.trim()) {
        throw new Error(`[docs-mdx] <CodeTabs /> requires a static "package" string in ${id}`)
      }
      codeTabsPackages.push(packageName.trim())
    }
  })

  return {
    codeTabsPackages: [...new Set(codeTabsPackages)],
    docsHeaderProps,
    hasDocsApiReference,
    hasDocsApiReferenceHeading,
  }
}

function parseFrontmatterData(raw: string | null | undefined, id: string): FrontmatterData {
  if (!raw?.trim()) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = YAML.parse(raw)
  } catch (error) {
    throw new Error(`[docs-mdx] invalid frontmatter in ${id}: ${String(error)}`)
  }

  if (parsed && (typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error(`[docs-mdx] frontmatter must be an object in ${id}`)
  }

  return (parsed ?? {}) as FrontmatterData
}

function asStaticApiDocOverride(value: unknown, id: string): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`[docs-mdx] apiDocOverride must be a static object in ${id}`)
  }
  return value as Record<string, unknown>
}

function createApiReferenceModel(
  tocApiDoc: TocApiDocShape | null,
  hasDocsApiReferenceWidget: boolean,
  sourceAttributes: SourceAttributeReference,
) {
  const hasMainSlots = Boolean(tocApiDoc?.slots.length)
  const hasMainProps = Boolean(tocApiDoc?.props.own.length)
  const hasMainItems = Boolean(tocApiDoc?.items)
  const hasMainInherited = Boolean(tocApiDoc?.props.inherited.length)
  const hasMainAria = sourceAttributes.aria.length > 0
  const hasMainDataAttributes = sourceAttributes.data.length > 0
  const hasGlobalAria = !hasMainSlots && hasMainAria
  const hasGlobalDataAttributes = !hasMainSlots && hasMainDataAttributes
  const hasMainApiReference =
    hasMainSlots ||
    hasMainProps ||
    hasMainItems ||
    hasMainInherited ||
    hasGlobalAria ||
    hasGlobalDataAttributes

  if (!tocApiDoc || !hasDocsApiReferenceWidget || !hasMainApiReference) {
    return null
  }

  const sections: Array<{
    id: string
    heading: string
    description?: string
    nameColumn?: string
    badges?: string[]
    props: unknown[]
    slots?: SourceSlotReference[]
    groups?: Array<{ description: string; props: unknown[] }>
  }> = []

  if (hasMainSlots) {
    sections.push({
      id: 'attributes',
      heading: 'Attributes',
      slots: createSlotReferenceDocs(tocApiDoc.slots, sourceAttributes),
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
    const itemsDoc = tocApiDoc.items as { description?: string; props?: unknown[] } | undefined
    sections.push({
      id: 'api-items',
      heading: 'Items',
      description: itemsDoc?.description,
      props: itemsDoc?.props ?? [],
    })
  }

  if (hasGlobalAria) {
    sections.push({
      id: 'api-aria',
      heading: 'ARIA',
      description: 'Accessibility attributes and roles emitted by the component markup.',
      nameColumn: 'Attribute',
      props: sourceAttributes.aria,
    })
  }

  if (hasGlobalDataAttributes) {
    sections.push({
      id: 'api-data-attributes',
      heading: 'Data Attributes',
      description: 'State and slot attributes exposed for styling hooks and selectors.',
      nameColumn: 'Attribute',
      props: sourceAttributes.data,
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
}

function stripMdxDefaultExport(code: string): string {
  return code.replace(/\n?export default MDXContent;\s*/, '\n')
}

function injectMdxEsm(source: string, esmCode: string): string {
  if (!esmCode) {
    return source
  }

  const frontmatterMatch = source.match(/^---\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/)
  if (!frontmatterMatch) {
    return `${esmCode}\n\n${source}`
  }

  return `${frontmatterMatch[0]}${esmCode}\n\n${source.slice(frontmatterMatch[0].length)}`
}

function createImplicitMdxEsm(options: {
  id: string
  pageKey: string
  docsRoot: string
  hasApiJson: boolean
  hasDocsHeader: boolean
  hasDocsApiReference: boolean
  apiDoc: unknown
  apiReferenceModel: unknown
}): string {
  const imports: string[] = []
  const declarations: string[] = []

  if (options.hasApiJson) {
    imports.push("import __docsRawApiDoc from './api.json'")
  }

  if (options.hasDocsHeader) {
    imports.push(
      `import { DocsHeader as __DocsHeader } from ${toSingleQuoted(
        toImportPath(options.id, path.join(options.docsRoot, 'components/docs-header')),
      )}`,
    )
  }

  if (options.hasDocsApiReference) {
    imports.push(
      `import { DocsApiReference as __DocsApiReference, HeadingWithAnchor } from ${toSingleQuoted(
        toImportPath(options.id, path.join(options.docsRoot, 'components/docs-api-reference')),
      )}`,
    )
  }

  if (options.apiDoc) {
    declarations.push(
      `export const __docsApiDoc = ${
        options.hasApiJson ? 'Object.assign({}, __docsRawApiDoc, ' : ''
      }${JSON.stringify(options.apiDoc)}${options.hasApiJson ? ')' : ''}`,
    )
  }

  if (options.apiReferenceModel) {
    declarations.push(
      `export const __docsApiReferenceModel = ${JSON.stringify(options.apiReferenceModel)}`,
    )
  }

  if (options.hasDocsHeader) {
    declarations.push(
      [
        'export function DocsHeader(props) {',
        `  return <__DocsHeader componentKey={${JSON.stringify(options.pageKey)}}${
          options.apiDoc ? ' apiDoc={__docsApiDoc}' : ''
        } {...props} />`,
        '}',
      ].join('\n'),
    )
  }

  if (options.hasDocsApiReference) {
    declarations.push(
      [
        'export function DocsApiReference(props) {',
        `  return <__DocsApiReference${
          options.apiReferenceModel ? ' model={__docsApiReferenceModel}' : ''
        } {...props} />`,
        '}',
      ].join('\n'),
    )
  }

  return [...imports, '', ...declarations].filter(Boolean).join('\n')
}

export function extractDocsHeaderProps(source: string, id: string): Record<string, unknown> | null {
  try {
    return scanMdxPage(source, id).docsHeaderProps
  } catch {
    return null
  }
}

export function compileMarkdownPage(
  markdownSource: string,
  id: string,
  options: CompileMarkdownOptions = {},
): string {
  const idWithoutQuery = id.split('?')[0] ?? id
  const page = resolveDocsPageContext(idWithoutQuery)
  const scannedPage = scanMdxPage(markdownSource, idWithoutQuery)
  const onThisPageEntries: OnThisPageEntryLiteral[] = []
  const widgetApiDocOverride = asStaticApiDocOverride(
    scannedPage.docsHeaderProps?.apiDocOverride,
    idWithoutQuery,
  )
  const runtimePath = toImportPath(idWithoutQuery, path.join(page.docsRoot, 'components/markdown'))
  const importLines = [`import { Markdown } from ${toSingleQuoted(runtimePath)}`]

  const loadedApiDoc = options.projectRoot
    ? loadComponentApiDoc(options.projectRoot, page.pageKey)
    : null

  const mergedApiDoc =
    widgetApiDocOverride && loadedApiDoc
      ? mergeConfig(loadedApiDoc, widgetApiDocOverride)
      : (loadedApiDoc ?? widgetApiDocOverride)
  const tocApiDoc = asTocApiDoc(mergedApiDoc)
  const renderedApiDoc = renderApiDocDescriptions(mergedApiDoc, options.highlightCode)
  const sourceAttributes = extractSourceAttributeReference(
    options.projectRoot,
    tocApiDoc?.component.sourcePath,
  )
  const apiReferenceModel = createApiReferenceModel(
    tocApiDoc,
    scannedPage.hasDocsApiReference,
    sourceAttributes,
  )
  const renderedApiReferenceModel = renderApiReferenceDescriptions(
    apiReferenceModel,
    options.highlightCode,
  )

  const implicitMdxEsm = createImplicitMdxEsm({
    id: idWithoutQuery,
    pageKey: page.pageKey,
    docsRoot: page.docsRoot,
    hasApiJson: Boolean(loadedApiDoc),
    hasDocsHeader: Boolean(scannedPage.docsHeaderProps),
    hasDocsApiReference: scannedPage.hasDocsApiReference,
    apiDoc: renderedApiDoc,
    apiReferenceModel: renderedApiReferenceModel,
  })
  const mdxSource = injectMdxEsm(markdownSource, implicitMdxEsm)
  const mdxResult = assertSyncResult(
    mdxToJs(mdxSource, {
      jsxImportSource: 'solid-js/h',
      elementAttributeNameCase: 'html',
      stylePropertyNameCase: 'css',
      features: DOCS_MDX_FEATURES,
      fileURL: pathToFileURL(idWithoutQuery),
      data: {} satisfies Data,
      mdastPlugins: [createDocsCodePlugin(options.highlightCode)],
      hastPlugins: [createDocsHastPlugin(onThisPageEntries)],
    }),
  )
  const parsedFrontmatter = parseFrontmatterData(mdxResult.frontmatter?.value, idWithoutQuery)

  if (scannedPage.hasDocsApiReference && renderedApiReferenceModel) {
    if (scannedPage.hasDocsApiReferenceHeading) {
      onThisPageEntries.push({
        id: 'api-ref',
        label: 'API Reference',
        level: 1,
      })
    }

    for (const section of renderedApiReferenceModel.sections) {
      onThisPageEntries.push({
        id: section.id,
        label: section.heading,
        level: 2,
      })
    }
  }

  const codeTabsCode = JSON.stringify(
    Object.fromEntries(
      scannedPage.codeTabsPackages.map((packageName) => [
        packageName,
        createCodeTabsItems(packageName, options.highlightCode),
      ]),
    ),
  )

  const configFields = [
    Object.keys(parsedFrontmatter).length > 0
      ? `frontmatter: ${JSON.stringify(parsedFrontmatter)}`
      : '',
    `onThisPageEntries: ${JSON.stringify(onThisPageEntries)}`,
    'Content: MDXContent',
    'codeTabs',
  ].filter(Boolean)

  return [
    ...importLines,
    '',
    stripMdxDefaultExport(mdxResult.code),
    `const codeTabs = ${codeTabsCode}`,
    '',
    'export default function MarkdownPage() {',
    `  return Markdown({ ${configFields.join(', ')} })`,
    '}',
    '',
  ].join('\n')
}
