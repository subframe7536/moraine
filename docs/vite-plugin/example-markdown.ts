import { readFileSync } from 'node:fs'
import path from 'node:path'

import MarkdownIt from 'markdown-it'
import type { Plugin } from 'vite'
import YAML from 'yaml'

const PAGE_FILE_RE = /[\\/]docs[\\/]pages[\\/].*\.md$/

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

interface MarkdownSegment {
  type: 'markdown'
  text: string
}

interface ExampleDirectiveSegment {
  type: 'example'
  source: string
  name: string
}

interface WidgetDirectiveSegment {
  type: 'widget'
  widgetName: string
  props?: Record<string, unknown>
}

type ParsedSegment = MarkdownSegment | ExampleDirectiveSegment | WidgetDirectiveSegment

interface FrontmatterData {
  extraApiKeys?: string[]
  apiDocOverride?: Record<string, unknown>
}

interface ParsedFrontmatter {
  data: FrontmatterData
  content: string
}

interface CompileMarkdownOptions {
  projectRoot?: string
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
}

function toPosixPath(value: string): string {
  return value.replaceAll('\\', '/')
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function toImportPath(fromFile: string, toFile: string): string {
  const relative = toPosixPath(path.relative(path.dirname(fromFile), toFile))
  return relative.startsWith('.') ? relative : `./${relative}`
}

function toSingleQuoted(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function parseFrontmatter(markdownSource: string): ParsedFrontmatter {
  const source = markdownSource.startsWith('\uFEFF') ? markdownSource.slice(1) : markdownSource
  const match = source.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { data: {}, content: source }
  }

  const parsed = YAML.parse(match[1]) as Record<string, unknown> | null
  const data: FrontmatterData = {}
  if (parsed && typeof parsed === 'object') {
    if (
      Array.isArray(parsed.extraApiKeys) &&
      parsed.extraApiKeys.every((item) => typeof item === 'string')
    ) {
      data.extraApiKeys = parsed.extraApiKeys
    }
    if (
      parsed.apiDocOverride &&
      typeof parsed.apiDocOverride === 'object' &&
      !Array.isArray(parsed.apiDocOverride)
    ) {
      data.apiDocOverride = parsed.apiDocOverride as Record<string, unknown>
    }
  }

  return {
    data,
    content: source.slice(match[0].length),
  }
}

function parseDirectivePayload(
  raw: string,
  id: string,
  directive: string,
): Record<string, unknown> {
  try {
    const parsed = YAML.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${directive} payload must be an object`)
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    throw new Error(`[example-markdown] invalid ${directive} block in ${id}: ${String(error)}`)
  }
}

function parseSegments(source: string, id: string): ParsedSegment[] {
  const lines = source.split(/\r?\n/g)
  const segments: ParsedSegment[] = []
  const markdownBuffer: string[] = []

  const flushMarkdown = () => {
    const text = markdownBuffer.join('\n').trim()
    markdownBuffer.length = 0
    if (!text) {
      return
    }
    segments.push({ type: 'markdown', text })
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? ''
    if (!line.startsWith(':::')) {
      markdownBuffer.push(lines[i] ?? '')
      continue
    }

    const directiveName = line.slice(3).trim()
    if (!directiveName) {
      markdownBuffer.push(lines[i] ?? '')
      continue
    }

    flushMarkdown()
    const payloadLines: string[] = []
    let foundEnd = false

    for (i = i + 1; i < lines.length; i++) {
      if ((lines[i]?.trim() ?? '') === ':::') {
        foundEnd = true
        break
      }
      payloadLines.push(lines[i] ?? '')
    }

    if (!foundEnd) {
      throw new Error(`[example-markdown] unclosed :::${directiveName} block in ${id}`)
    }

    const payload = parseDirectivePayload(payloadLines.join('\n'), id, `:::${directiveName}`)

    if (directiveName === 'example') {
      const sourcePath = payload.source
      const exportName = payload.name
      if (typeof exportName !== 'string' || !exportName.trim()) {
        throw new Error(`[example-markdown] :::example requires "name" in ${id}`)
      }

      const normalizedSource =
        typeof sourcePath === 'string' && sourcePath.trim()
          ? toPosixPath(sourcePath.trim())
          : `./examples/${toKebabCase(exportName.trim())}.tsx`

      segments.push({
        type: 'example',
        source: normalizedSource,
        name: exportName.trim(),
      })
      continue
    }

    if (directiveName === 'widget') {
      const widgetName = payload.name
      if (typeof widgetName !== 'string' || !widgetName.trim()) {
        throw new Error(`[example-markdown] :::widget requires "name" in ${id}`)
      }
      const widgetProps =
        payload.props && typeof payload.props === 'object' && !Array.isArray(payload.props)
          ? (payload.props as Record<string, unknown>)
          : undefined
      segments.push({
        type: 'widget',
        widgetName: widgetName.trim(),
        ...(widgetProps ? { props: widgetProps } : {}),
      })
      continue
    }

    throw new Error(`[example-markdown] unsupported :::${directiveName} block in ${id}`)
  }

  flushMarkdown()

  return segments
}

function loadApiDoc(projectRoot: string, key: string): unknown | null {
  try {
    const jsonPath = path.join(projectRoot, 'docs/api-doc/components', `${key}.json`)
    const content = readFileSync(jsonPath, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return override
  }

  if (!base || typeof base !== 'object' || Array.isArray(base)) {
    return override
  }

  const output: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      output[key] = value
      continue
    }

    if (value && typeof value === 'object') {
      output[key] = deepMerge(output[key], value)
      continue
    }

    output[key] = value
  }

  return output
}

function resolveDocsRoot(pageId: string): string {
  const normalized = toPosixPath(pageId)
  const marker = '/docs/pages/'
  const markerIndex = normalized.lastIndexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`[example-markdown] page path is outside docs/pages: ${pageId}`)
  }
  return path.normalize(normalized.slice(0, markerIndex + '/docs'.length))
}

function derivePageKey(pageId: string): string {
  const normalized = toPosixPath(pageId)
  const marker = '/docs/pages/'
  const markerIndex = normalized.lastIndexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`[example-markdown] page path is outside docs/pages: ${pageId}`)
  }

  const relative = normalized.slice(markerIndex + marker.length)
  const segments = relative.split('/').filter(Boolean)
  if (segments.length === 0) {
    throw new Error(`[example-markdown] failed to derive page key from ${pageId}`)
  }

  const fileName = segments.at(-1) ?? ''
  const fileBaseName = fileName.endsWith('.md') ? fileName.slice(0, -'.md'.length) : fileName
  const parentName = segments.length > 1 ? (segments.at(-2) ?? '') : ''

  return fileBaseName === parentName ? parentName : fileBaseName
}

function buildSegmentLiterals(segments: ParsedSegment[]): SegmentLiteral[] {
  let exampleIndex = 0

  return segments.map((segment) => {
    if (segment.type === 'markdown') {
      const html = markdown.render(segment.text).trim()
      return {
        code: `{ type: 'markdown', html: ${JSON.stringify(html)} }`,
      }
    }

    if (segment.type === 'widget') {
      return {
        code: `{ type: 'widget', widgetName: ${JSON.stringify(segment.widgetName)}${
          segment.props ? `, props: ${JSON.stringify(segment.props)}` : ''
        } }`,
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
  const parsedFrontmatter = parseFrontmatter(markdownSource)
  const parsedSegments = parseSegments(parsedFrontmatter.content, idWithoutQuery)
  const segmentLiterals = buildSegmentLiterals(parsedSegments)

  const docsRoot = resolveDocsRoot(idWithoutQuery)
  const derivedComponentKey = derivePageKey(idWithoutQuery)
  const runtimePath = toImportPath(
    idWithoutQuery,
    path.join(docsRoot, 'components/example-markdown-page'),
  )

  const importLines = [`import { renderExampleMarkdownPage } from ${toSingleQuoted(runtimePath)}`]
  const segmentCodes: string[] = []

  for (const literal of segmentLiterals) {
    if (!literal.importSpec) {
      segmentCodes.push(literal.code)
      continue
    }

    const componentImport =
      literal.importSpec.exportName === 'default'
        ? `import ${literal.importSpec.componentAlias} from ${toSingleQuoted(literal.importSpec.sourcePath)}`
        : `import { ${literal.importSpec.exportName} as ${literal.importSpec.componentAlias} } from ${toSingleQuoted(
            literal.importSpec.sourcePath,
          )}`
    importLines.push(componentImport)

    importLines.push(
      `import ${literal.importSpec.codeAlias} from ${toSingleQuoted(
        `${literal.importSpec.sourcePath}?example-source&name=${encodeURIComponent(
          literal.importSpec.exportName,
        )}`,
      )}`,
    )

    segmentCodes.push(literal.code)
  }

  const extraApiKeys = parsedFrontmatter.data.extraApiKeys ?? []

  const loadedApiDoc = options.projectRoot
    ? loadApiDoc(options.projectRoot, derivedComponentKey)
    : null
  const loadedExtraApiDocs =
    options.projectRoot && extraApiKeys.length > 0
      ? [...new Set(extraApiKeys)]
          .map((key) => loadApiDoc(options.projectRoot!, key))
          .filter((value): value is unknown => Boolean(value))
      : []

  const mergedApiDoc =
    parsedFrontmatter.data.apiDocOverride && loadedApiDoc
      ? deepMerge(loadedApiDoc, parsedFrontmatter.data.apiDocOverride)
      : (loadedApiDoc ?? parsedFrontmatter.data.apiDocOverride)

  const shouldExposeComponentKey = Boolean(mergedApiDoc || loadedExtraApiDocs.length > 0)
  const configFields = [
    shouldExposeComponentKey ? `componentKey: ${JSON.stringify(derivedComponentKey)}` : '',
    mergedApiDoc ? `apiDoc: ${JSON.stringify(mergedApiDoc)}` : '',
    loadedExtraApiDocs.length > 0 ? `extraApiDocs: ${JSON.stringify(loadedExtraApiDocs)}` : '',
    `segments`,
  ].filter(Boolean)

  return [
    ...importLines,
    '',
    `const segments = [${segmentCodes.join(', ')}]`,
    '',
    'export default function MarkdownPage() {',
    `  return renderExampleMarkdownPage({ ${configFields.join(', ')} })`,
    '}',
    '',
  ].join('\n')
}

export function exampleMarkdownPlugin(projectRoot?: string): Plugin {
  let resolvedRoot = ''

  return {
    name: 'moraine-example-markdown',
    enforce: 'pre',

    configResolved(config) {
      resolvedRoot = projectRoot ?? path.resolve(config.root, '..')
    },

    transform: {
      order: 'pre',
      filter: {
        id: [PAGE_FILE_RE],
      },
      handler(code, id) {
        return compileMarkdownPage(code, id, { projectRoot: resolvedRoot })
      },
    },
  }
}
