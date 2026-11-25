import path from 'pathe'

import { toSingleQuoted } from '../core/strings.ts'

import type { ParsePreviewCode, ProgramNode } from './ast.ts'

/** Root-relative (docs Vite root) module that renders a preview block. */
const DOCS_PREVIEW_MODULE = '/routes/components/markdown/preview-block.tsx'
interface PreviewExport {
  importedName: string
  sourceName: string
  default: boolean
}

function collectPreviewExports(program: ProgramNode, id: string): Array<PreviewExport> {
  const exports: Array<PreviewExport> = []

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
  const [first] = exports
  if (!first || exports.length !== 1) {
    throw new Error(
      `[preview] expected exactly one component export in ${id}, found ${exports.length}`,
    )
  }
  return first
}

export function resolvePreviewExportName(program: ProgramNode, id: string): string {
  return resolvePreviewExport(program, id).sourceName
}

export async function transformPreviewModule(
  code: string,
  sourcePath: string,
  parsePreviewCode: ParsePreviewCode,
  options: { ssr?: boolean } = {},
): Promise<string | null> {
  const sourceImportPath = `./${path.basename(sourcePath)}`
  const previewExport = resolvePreviewExport(await parsePreviewCode(code), sourcePath)
  const imports = [
    `import { createComponent } from 'solid-js'`,
    `import { DocsPreview } from ${toSingleQuoted(DOCS_PREVIEW_MODULE)}`,
    options.ssr
      ? ''
      : previewExport.default
        ? `import __Preview from ${toSingleQuoted(sourceImportPath)}`
        : `import { ${previewExport.importedName} as __Preview } from ${toSingleQuoted(sourceImportPath)}`,
    `import __PreviewSource from ${toSingleQuoted(`${sourceImportPath}?preview-source`)}`,
  ].filter(Boolean)

  // The default export is a component so the MDX `<Preview>` can `lazy()` this module directly.
  return [
    ...imports,
    '',
    `const component = ${options.ssr ? '() => null' : '__Preview'}`,
    '',
    'export default function Preview() {',
    '  return createComponent(DocsPreview, { component, source: __PreviewSource })',
    '}',
    '',
  ].join('\n')
}
