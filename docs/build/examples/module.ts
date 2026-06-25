import path from 'node:path'

import { toImportPath } from '../core/paths'
import { toKebabCase, toSingleQuoted } from '../core/strings'

import type { ParseExampleCode, ProgramNode } from './ast'

interface ExampleExport {
  importedName: string
  exportedName: string
  sourceName: string
}

interface DocsExampleContext {
  sourcePath: string
  docsRoot: string
  pageKey: string
}

function isExampleRequest(id: string): boolean {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return false
  }

  const params = new URLSearchParams(id.slice(queryIndex + 1))
  return params.has('example')
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function resolveDocsExampleContext(sourcePath: string): DocsExampleContext {
  const normalized = sourcePath.replaceAll('\\', '/')
  const marker = '/docs/pages/'
  const markerIndex = normalized.lastIndexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`[example] example path is outside docs/pages: ${sourcePath}`)
  }

  const docsRoot = path.normalize(normalized.slice(0, markerIndex + '/docs'.length))
  const relativePath = normalized.slice(markerIndex + marker.length)
  const segments = relativePath.split('/')
  const pageKey =
    segments.length >= 3 ? segments[1]! : path.basename(sourcePath, path.extname(sourcePath))

  return {
    sourcePath,
    docsRoot,
    pageKey,
  }
}

function createDemoExportName(example: DocsExampleContext, sourceName: string): string {
  const pageName = toPascalCase(example.pageKey)
  return sourceName.startsWith(pageName) ? `Demo${sourceName}` : `Demo${pageName}${sourceName}`
}

function getNamedExports(program: ProgramNode): ExampleExport[] {
  const exports: ExampleExport[] = []

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration?.type === 'FunctionDeclaration' && statement.declaration.id) {
        const name = statement.declaration.id.name
        exports.push({ importedName: name, exportedName: name, sourceName: name })
        continue
      }

      if (statement.declaration?.type === 'VariableDeclaration') {
        for (const declaration of statement.declaration.declarations) {
          if (declaration.id.type === 'Identifier') {
            const name = declaration.id.name
            exports.push({ importedName: name, exportedName: name, sourceName: name })
          }
        }
        continue
      }

      for (const specifier of statement.specifiers) {
        if (
          specifier.type === 'ExportSpecifier' &&
          specifier.local.type === 'Identifier' &&
          specifier.exported.type === 'Identifier'
        ) {
          exports.push({
            importedName: specifier.local.name,
            exportedName: specifier.exported.name,
            sourceName: specifier.local.name,
          })
        }
      }
      continue
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push({
        importedName: 'DefaultExample',
        exportedName: 'default',
        sourceName: 'default',
      })
    }
  }

  return exports
}

export function transformExampleModule(
  code: string,
  id: string,
  parseExampleCode: ParseExampleCode,
  options: { ssr?: boolean } = {},
): string | null {
  if (!isExampleRequest(id)) {
    return null
  }

  const sourcePath = id.slice(0, id.indexOf('?'))
  const example = resolveDocsExampleContext(sourcePath)
  const sourceImportPath = `./${path.basename(sourcePath)}`
  const runtimePath = toImportPath(
    sourcePath,
    path.join(example.docsRoot, 'components/docs-demo-block'),
  )
  const program = parseExampleCode(code)
  const namedExports = getNamedExports(program)
  const defaultExport = namedExports.find((item) => item.exportedName === 'default')
  const nonDefaultExports = namedExports.filter((item) => item.exportedName !== 'default')
  const componentImportNames = nonDefaultExports
    .map((item) => `${item.importedName} as __${item.importedName}`)
    .join(', ')
  const importLines = [
    `import { createDocsDemo } from ${toSingleQuoted(runtimePath)}`,
    componentImportNames && !options.ssr
      ? `import { ${componentImportNames} } from ${toSingleQuoted(sourceImportPath)}`
      : '',
    defaultExport && !options.ssr ? `import __DefaultExample from ${toSingleQuoted(sourceImportPath)}` : '',
  ].filter(Boolean)
  const exportLines: string[] = []

  for (const item of nonDefaultExports) {
    const demoName = createDemoExportName(example, item.exportedName)
    const sourceAlias = `__${demoName}Source`
    importLines.push(
      `import ${sourceAlias} from ${toSingleQuoted(
        `${sourceImportPath}?example-source&name=${encodeURIComponent(item.sourceName)}`,
      )}`,
    )
    exportLines.push(
      `export const ${demoName} = createDocsDemo(${options.ssr ? '() => null' : `__${item.importedName}`}, ${sourceAlias})`,
    )
  }

  if (defaultExport) {
    const pageName = toPascalCase(example.pageKey)
    const demoName = `Demo${pageName}${toPascalCase(toKebabCase(path.basename(sourcePath, path.extname(sourcePath))))}`
    importLines.push(
      `import __${demoName}Source from ${toSingleQuoted(`${sourceImportPath}?example-source&name=default`)}`,
    )
    exportLines.push(
      `export default createDocsDemo(${options.ssr ? '() => null' : '__DefaultExample'}, __${demoName}Source)`,
    )
  }

  return [...importLines, '', ...exportLines, ''].join('\n')
}
