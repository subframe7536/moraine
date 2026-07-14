import path from 'node:path'

import { toSingleQuoted } from '../core/strings'

import type { ParseExampleCode, ProgramNode } from './ast'

interface ExampleExport {
  importedName: string
  sourceName: string
  default: boolean
}

function isExampleRequest(id: string): boolean {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return false
  }

  const params = new URLSearchParams(id.slice(queryIndex + 1))
  return params.has('example')
}

function collectExampleExports(program: ProgramNode, id: string): ExampleExport[] {
  const exports: ExampleExport[] = []

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push({ importedName: 'default', sourceName: 'default', default: true })
      continue
    }

    if (statement.type !== 'ExportNamedDeclaration' || statement.exportKind === 'type') {
      continue
    }

    if (statement.source) {
      throw new Error(`[example] re-exported components are not supported in ${id}`)
    }

    if (statement.declaration?.type === 'FunctionDeclaration' && statement.declaration.id) {
      const name = statement.declaration.id.name
      exports.push({ importedName: name, sourceName: name, default: false })
      continue
    }

    if (statement.declaration?.type === 'VariableDeclaration') {
      for (const declaration of statement.declaration.declarations) {
        if (declaration.id.type === 'Identifier') {
          const name = declaration.id.name
          exports.push({ importedName: name, sourceName: name, default: false })
        }
      }
      continue
    }

    for (const specifier of statement.specifiers) {
      if (
        specifier.type === 'ExportSpecifier' &&
        specifier.exportKind !== 'type' &&
        specifier.local.type === 'Identifier' &&
        specifier.exported.type === 'Identifier'
      ) {
        exports.push({
          importedName: specifier.exported.name,
          sourceName: specifier.local.name,
          default: false,
        })
      }
    }
  }

  return exports
}

function resolveExampleExport(program: ProgramNode, id: string): ExampleExport {
  const exports = collectExampleExports(program, id)
  if (exports.length !== 1) {
    throw new Error(
      `[example] expected exactly one component export in ${id}, found ${exports.length}`,
    )
  }
  return exports[0]!
}

export function resolveExampleExportName(program: ProgramNode, id: string): string {
  return resolveExampleExport(program, id).sourceName
}

export async function transformExampleModule(
  code: string,
  id: string,
  parseExampleCode: ParseExampleCode,
  options: { ssr?: boolean } = {},
): Promise<string | null> {
  if (!isExampleRequest(id)) {
    return null
  }

  const sourcePath = id.slice(0, id.indexOf('?'))
  const sourceImportPath = `./${path.basename(sourcePath)}`
  const exampleExport = resolveExampleExport(await parseExampleCode(code), sourcePath)
  const imports = [
    options.ssr
      ? ''
      : exampleExport.default
        ? `import __Example from ${toSingleQuoted(sourceImportPath)}`
        : `import { ${exampleExport.importedName} as __Example } from ${toSingleQuoted(sourceImportPath)}`,
    `import __ExampleSource from ${toSingleQuoted(
      `${sourceImportPath}?example-source&name=${encodeURIComponent(exampleExport.sourceName)}`,
    )}`,
  ].filter(Boolean)

  return [
    ...imports,
    '',
    `const component = ${options.ssr ? '() => null' : '__Example'}`,
    '',
    'export default { component, source: __ExampleSource }',
    '',
  ].join('\n')
}
