import { parseSync } from 'oxc-parser'
import { walk } from 'oxc-walker'
import type { Plugin } from 'vite'

import { getDocsHighlighter } from './shiki-highlight'

interface ComponentDeclaration {
  name: string
  sourceText: string
}

type ProgramNode = ReturnType<typeof parseSync>['program']

function parseExampleSourceQuery(id: string): { name: string } | null {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return null
  }

  const query = id.slice(queryIndex + 1)
  const params = new URLSearchParams(query)
  if (!params.has('example-source')) {
    return null
  }

  const name = params.get('name')
  if (!name) {
    return null
  }

  return { name }
}

function getVariableDeclaratorComponentDeclaration(
  declaration: Record<string, unknown>,
  statement: Record<string, unknown>,
  code: string,
): ComponentDeclaration | null {
  if (!('id' in declaration) || !('init' in declaration)) {
    return null
  }

  const identifier = declaration.id
  const init = declaration.init
  if (
    !identifier ||
    typeof identifier !== 'object' ||
    !('type' in identifier) ||
    identifier.type !== 'Identifier' ||
    !('name' in identifier) ||
    typeof identifier.name !== 'string'
  ) {
    return null
  }

  if (
    !init ||
    typeof init !== 'object' ||
    !('type' in init) ||
    (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression')
  ) {
    return null
  }

  if (!('start' in statement) || !('end' in statement)) {
    return null
  }

  return {
    name: identifier.name,
    sourceText: code.slice(statement.start as number, statement.end as number).trim(),
  }
}

function getTopLevelComponentDeclaration(
  statement: unknown,
  code: string,
): ComponentDeclaration | null {
  if (!statement || typeof statement !== 'object' || !('type' in statement)) {
    return null
  }

  if (statement.type === 'FunctionDeclaration') {
    if (
      !('id' in statement) ||
      !statement.id ||
      typeof statement.id !== 'object' ||
      !('type' in statement.id) ||
      statement.id.type !== 'Identifier' ||
      !('name' in statement.id) ||
      typeof statement.id.name !== 'string' ||
      !('start' in statement) ||
      !('end' in statement)
    ) {
      return null
    }

    return {
      name: statement.id.name,
      sourceText: code.slice(statement.start as number, statement.end as number).trim(),
    }
  }

  if (statement.type === 'VariableDeclaration') {
    if (!('declarations' in statement) || !Array.isArray(statement.declarations)) {
      return null
    }
    if (statement.declarations.length !== 1) {
      return null
    }
    return getVariableDeclaratorComponentDeclaration(
      statement.declarations[0] as Record<string, unknown>,
      statement as Record<string, unknown>,
      code,
    )
  }

  if (
    statement.type === 'ExportNamedDeclaration' &&
    'declaration' in statement &&
    statement.declaration &&
    typeof statement.declaration === 'object'
  ) {
    return getTopLevelComponentDeclaration(statement.declaration, code)
  }

  return null
}

function resolveDefaultExportSource(
  program: ProgramNode,
  code: string,
  byName: Map<string, string>,
): string | null {
  let resolved: string | null = null

  walk(program, {
    enter(node) {
      if (resolved || node.type !== 'ExportDefaultDeclaration') {
        return
      }

      const declaration = node.declaration
      if (!declaration || typeof declaration !== 'object' || !('type' in declaration)) {
        return
      }

      if (
        declaration.type === 'Identifier' &&
        'name' in declaration &&
        typeof declaration.name === 'string'
      ) {
        resolved = byName.get(declaration.name) ?? null
        return
      }

      if ('start' in declaration && 'end' in declaration) {
        resolved = code.slice(declaration.start as number, declaration.end as number).trim()
      }
    },
  })

  return resolved
}

export function resolveExampleComponentSource(code: string, name: string): string | null {
  const { program } = parseSync('example.tsx', code, { lang: 'tsx', sourceType: 'module' })
  const byName = new Map<string, string>()

  for (const statement of program.body) {
    const declaration = getTopLevelComponentDeclaration(statement, code)
    if (!declaration) {
      continue
    }
    byName.set(declaration.name, declaration.sourceText)
  }

  if (name === 'default') {
    return resolveDefaultExportSource(program, code, byName)
  }

  return byName.get(name) ?? null
}

export function transformExampleSourceModule(
  code: string,
  id: string,
  toHTML: (src: string, lang: 'tsx' | 'bash') => string,
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

  const html = toHTML(sourceText, 'tsx')
  return `export default ${JSON.stringify(html)}\n`
}

export async function exampleSourcePlugin(): Promise<Plugin> {
  const highlighter = await getDocsHighlighter()

  return {
    name: 'moraine-example-source',
    enforce: 'pre',

    transform: {
      order: 'pre',
      async handler(code, id) {
        return transformExampleSourceModule(code, id, (source, lang) =>
          highlighter.codeToHtml(source, {
            lang,
            themes: { light: 'one-light', dark: 'one-dark-pro' },
          }),
        )
      },
    },
  }
}
