import { parsePreviewCode as defaultParsePreviewCode } from './ast'
import type { ParsePreviewCode, ProgramNode } from './ast'

interface QueryResult {
  name?: string
}

interface NodeRange {
  start: number
  end: number
}

interface Replacement {
  start: number
  end: number
  replacement: string
}

function hasRange(value: unknown): value is NodeRange {
  if (!value || typeof value !== 'object') {
    return false
  }

  const node = value as Record<string, unknown>
  return (
    'start' in node &&
    'end' in node &&
    typeof node.start === 'number' &&
    typeof node.end === 'number'
  )
}

function parsePreviewSourceQuery(id: string): QueryResult | null {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return null
  }

  const params = new URLSearchParams(id.slice(queryIndex + 1))
  if (!params.has('preview-source')) {
    return null
  }

  const name = params.get('name')
  return name ? { name } : {}
}

function convertSrcImport(specifier: string): string {
  if (
    specifier === '@src' ||
    specifier === '@src/index' ||
    specifier === '@src/index.ts' ||
    specifier === '@src/index.tsx'
  ) {
    return 'moraine'
  }
  if (specifier === '@src/utils' || specifier === '@src/utils.ts') {
    return 'moraine/utils'
  }
  if (specifier === '@src/unocss' || specifier === '@src/unocss.ts') {
    return 'moraine/unocss'
  }
  if (specifier === '@src/tailwind' || specifier === '@src/tailwind.ts') {
    return 'moraine/tailwind'
  }
  if (
    specifier === '@src/tw4.css' ||
    specifier === '@src/tw3.css' ||
    specifier === '@src/icon.css'
  ) {
    return `moraine/${specifier.slice('@src/'.length)}`
  }
  if (
    specifier.startsWith('@src/elements/') ||
    specifier.startsWith('@src/forms/') ||
    specifier.startsWith('@src/navigation/') ||
    specifier.startsWith('@src/overlays/')
  ) {
    return 'moraine'
  }
  if (specifier.startsWith('@src/')) {
    const subpath = specifier.slice('@src/'.length).replace(/\.(?:tsx?|jsx?)$/, '')
    return subpath === 'index' ? 'moraine' : `moraine/${subpath}`
  }
  return specifier
}

function toQuotedSpecifier(code: string, node: NodeRange, newSpecifier: string): string {
  const raw = code.slice(node.start, node.end)
  const quote = raw.startsWith('"') ? '"' : "'"
  return `${quote}${newSpecifier}${quote}`
}

function transformSourceImports(code: string, program: ProgramNode): string {
  const replacements: Replacement[] = []

  for (const statement of program.body) {
    if (
      statement.type === 'ImportDeclaration' ||
      statement.type === 'ExportNamedDeclaration' ||
      statement.type === 'ExportAllDeclaration'
    ) {
      const source = statement.source
      if (
        source &&
        typeof source.value === 'string' &&
        source.value.startsWith('@src') &&
        hasRange(source)
      ) {
        const converted = convertSrcImport(source.value)
        replacements.push({
          start: source.start,
          end: source.end,
          replacement: toQuotedSpecifier(code, source, converted),
        })
      }
    }
  }

  let result = code
  for (const { start, end, replacement } of replacements.sort((a, b) => b.start - a.start)) {
    result = `${result.slice(0, start)}${replacement}${result.slice(end)}`
  }

  return result.trim()
}

function convertFallbackImports(code: string): string {
  return code.replace(/(['"])@src(\/[^'"]*)?\1/g, (_match, quote: string, subpath?: string) => {
    const specifier = `@src${subpath ?? ''}`
    return `${quote}${convertSrcImport(specifier)}${quote}`
  })
}

export async function resolvePreviewComponentSource(
  code: string,
  _name?: string,
  parseCode: ParsePreviewCode = defaultParsePreviewCode,
): Promise<string | null> {
  const trimmed = code.trim()
  if (!trimmed) {
    return null
  }

  try {
    const program = await parseCode(code)
    return transformSourceImports(code, program)
  } catch {
    return convertFallbackImports(trimmed)
  }
}

export async function transformPreviewSourceModule(
  code: string,
  id: string,
  parsePreviewCode: ParsePreviewCode,
  toHtml: (src: string, lang: 'tsx') => Promise<string>,
): Promise<string | null> {
  const query = parsePreviewSourceQuery(id)
  if (!query) {
    return null
  }

  const sourceText = await resolvePreviewComponentSource(code, query.name, parsePreviewCode)
  if (!sourceText) {
    return 'export default ""\n'
  }

  return `export default ${JSON.stringify(await toHtml(sourceText, 'tsx'))}\n`
}
