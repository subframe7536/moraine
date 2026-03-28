import { parseSync } from 'oxc-parser'

import type { DocsHighlightLang } from '../core/shiki'

interface ComponentDeclaration {
  name: string
  sourceText: string
}

type ProgramNode = ReturnType<typeof parseSync>['program']
type StatementNode = ProgramNode['body'][number]

interface QueryResult {
  name: string
}

interface NodeRange {
  start: number
  end: number
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

function parseExampleSourceQuery(id: string): QueryResult | null {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return null
  }

  const params = new URLSearchParams(id.slice(queryIndex + 1))
  if (!params.has('example-source')) {
    return null
  }

  const name = params.get('name')
  return name ? { name } : null
}

function sliceSource(code: string, node: NodeRange): string {
  return code.slice(node.start, node.end).trim()
}

function getVariableComponentDeclaration(
  statement: Extract<StatementNode, { type: 'VariableDeclaration' }>,
  code: string,
): ComponentDeclaration | null {
  if (statement.declarations.length !== 1) {
    return null
  }

  const declaration = statement.declarations[0]
  if (
    declaration.id.type !== 'Identifier' ||
    !declaration.init ||
    (declaration.init.type !== 'ArrowFunctionExpression' &&
      declaration.init.type !== 'FunctionExpression') ||
    !hasRange(statement)
  ) {
    return null
  }

  return {
    name: declaration.id.name,
    sourceText: sliceSource(code, statement),
  }
}

function getTopLevelComponentDeclaration(
  statement: StatementNode,
  code: string,
): ComponentDeclaration | null {
  if (statement.type === 'FunctionDeclaration') {
    if (!statement.id || statement.id.type !== 'Identifier' || !hasRange(statement)) {
      return null
    }

    return {
      name: statement.id.name,
      sourceText: sliceSource(code, statement),
    }
  }

  if (statement.type === 'VariableDeclaration') {
    return getVariableComponentDeclaration(statement, code)
  }

  if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
    return getTopLevelComponentDeclaration(statement.declaration as StatementNode, code)
  }

  return null
}

function resolveDefaultExportSource(
  program: ProgramNode,
  code: string,
  byName: Map<string, string>,
): string | null {
  for (const statement of program.body) {
    if (statement.type !== 'ExportDefaultDeclaration') {
      continue
    }

    const declaration = statement.declaration
    if (declaration.type === 'Identifier') {
      return byName.get(declaration.name) ?? null
    }

    if (hasRange(declaration)) {
      return sliceSource(code, declaration)
    }

    return null
  }

  return null
}

export function resolveExampleComponentSource(code: string, name: string): string | null {
  const { program } = parseSync('example.tsx', code, { lang: 'tsx', sourceType: 'module' })
  const byName = new Map<string, string>()

  for (const statement of program.body) {
    const declaration = getTopLevelComponentDeclaration(statement, code)
    if (declaration) {
      byName.set(declaration.name, declaration.sourceText)
    }
  }

  return name === 'default'
    ? resolveDefaultExportSource(program, code, byName)
    : (byName.get(name) ?? null)
}

export function transformExampleSourceModule(
  code: string,
  id: string,
  toHtml: (src: string, lang: Extract<DocsHighlightLang, 'tsx' | 'bash'>) => string,
): string | null {
  const query = parseExampleSourceQuery(id)
  if (!query) {
    return null
  }

  const sourceText = resolveExampleComponentSource(code, query.name)
  if (!sourceText) {
    console.warn(`[example-source] component "${query.name}" not found in ${id}`)
    return 'export default ""\n'
  }

  return `export default ${JSON.stringify(toHtml(sourceText, 'tsx'))}\n`
}
