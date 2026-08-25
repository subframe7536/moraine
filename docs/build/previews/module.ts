import path from 'node:path'

import { toSingleQuoted } from '../core/strings.ts'

import type { ParsePreviewCode, ProgramNode } from './ast.ts'

interface PreviewExport {
  importedName: string
  sourceName: string
  default: boolean
}

function isPreviewRequest(id: string): boolean {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return false
  }

  const params = new URLSearchParams(id.slice(queryIndex + 1))
  return params.has('preview')
}

function collectPreviewExports(program: ProgramNode, id: string): PreviewExport[] {
  const exports: PreviewExport[] = []

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push({ importedName: 'default', sourceName: 'default', default: true })
      continue
    }

    if (statement.type !== 'ExportNamedDeclaration' || statement.exportKind === 'type') {
      continue
    }

    if (statement.source) {
      throw new Error(`[preview] re-exported components are not supported in ${id}`)
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

function resolvePreviewExport(program: ProgramNode, id: string): PreviewExport {
  const exports = collectPreviewExports(program, id)
  if (exports.length !== 1) {
    throw new Error(
      `[preview] expected exactly one component export in ${id}, found ${exports.length}`,
    )
  }
  return exports[0]!
}

export function resolvePreviewExportName(program: ProgramNode, id: string): string {
  return resolvePreviewExport(program, id).sourceName
}

export async function transformPreviewModule(
  code: string,
  id: string,
  parsePreviewCode: ParsePreviewCode,
  options: { ssr?: boolean } = {},
): Promise<string | null> {
  if (!isPreviewRequest(id)) {
    return null
  }

  const sourcePath = id.slice(0, id.indexOf('?'))
  const sourceImportPath = `./${path.basename(sourcePath)}`
  const previewExport = resolvePreviewExport(await parsePreviewCode(code), sourcePath)
  const imports = [
    options.ssr
      ? ''
      : previewExport.default
        ? `import __Preview from ${toSingleQuoted(sourceImportPath)}`
        : `import { ${previewExport.importedName} as __Preview } from ${toSingleQuoted(sourceImportPath)}`,
    `import __PreviewSource from ${toSingleQuoted(
      `${sourceImportPath}?preview-source&name=${encodeURIComponent(previewExport.sourceName)}`,
    )}`,
  ].filter(Boolean)

  return [
    ...imports,
    '',
    `const component = ${options.ssr ? '() => null' : '__Preview'}`,
    '',
    'export default { component, source: __PreviewSource }',
    '',
  ].join('\n')
}
