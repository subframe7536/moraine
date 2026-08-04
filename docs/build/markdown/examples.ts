import { existsSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineMdastPlugin } from 'satteri'
import type { MdastNode } from 'satteri'

import { resolveDocsPageContext, toImportPath } from '../core/paths.ts'

import { asObjectRecord, getStaticStringAttribute } from './mdx.ts'

export interface ScannedMdxExample {
  path: string
  importPath: string
}

export type MdxExamplesPlugin = ReturnType<typeof defineMdastPlugin>

function isPathInside(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath)
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export function resolveExampleFile(id: string, examplePath: string): string {
  if (
    (!examplePath.startsWith('./') && !examplePath.startsWith('../')) ||
    examplePath.includes('\\')
  ) {
    throw new Error(
      `[docs-mdx] <Example /> path must be a relative POSIX path in ${id}: ${examplePath}`,
    )
  }
  if (examplePath.includes('?') || examplePath.includes('#')) {
    throw new Error(
      `[docs-mdx] <Example /> path cannot contain a query or hash in ${id}: ${examplePath}`,
    )
  }

  const extension = path.posix.extname(examplePath)
  if (extension && extension !== '.tsx') {
    throw new Error(
      `[docs-mdx] <Example /> path must reference a TSX file in ${id}: ${examplePath}`,
    )
  }

  const candidate = path.resolve(path.dirname(id), extension ? examplePath : `${examplePath}.tsx`)
  const pagesRoot = resolveDocsPageContext(id).pagesRoot
  if (!isPathInside(path.resolve(pagesRoot), candidate)) {
    throw new Error(
      `[docs-mdx] <Example /> path must stay inside docs/pages in ${id}: ${examplePath}`,
    )
  }
  if (!existsSync(candidate)) {
    throw new Error(`[docs-mdx] <Example /> file not found in ${id}: ${examplePath}`)
  }
  if (!statSync(candidate).isFile()) {
    throw new Error(`[docs-mdx] <Example /> path is not a file in ${id}: ${examplePath}`)
  }

  const realPagesRoot = realpathSync(pagesRoot)
  const realCandidate = realpathSync(candidate)
  if (!isPathInside(realPagesRoot, realCandidate)) {
    throw new Error(
      `[docs-mdx] <Example /> path must stay inside docs/pages in ${id}: ${examplePath}`,
    )
  }
  return candidate
}

export function createMdxExamplesPlugin(id?: string): MdxExamplesPlugin {
  const examples = new Map<string, ScannedMdxExample>()

  const visitJsxNode = (node: unknown, ctx: { fileURL?: URL }) => {
    const documentId = id ?? (ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined)
    if (!documentId) {
      throw new Error('[docs-mdx] <Example /> requires a file URL')
    }
    const record = asObjectRecord(node)
    if (!record || record.name !== 'Example') {
      return
    }

    const examplePath = getStaticStringAttribute(record, 'Example', 'path', documentId)?.trim()
    if (!examplePath) {
      throw new Error(`[docs-mdx] <Example /> requires a static "path" string in ${documentId}`)
    }
    const example =
      examples.get(examplePath) ??
      (() => {
        const sourcePath = resolveExampleFile(documentId, examplePath)
        const nextExample = {
          path: examplePath,
          importPath: `${toImportPath(documentId, sourcePath)}?example`,
        }
        examples.set(examplePath, nextExample)
        return nextExample
      })()

    const attributes = [
      ...(Array.isArray(record.attributes) ? record.attributes : []),
      {
        type: 'mdxJsxAttribute',
        name: 'load',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: `() => import(${JSON.stringify(example.importPath)})`,
        },
      },
    ]
    return { ...(node as MdastNode), attributes } as MdastNode
  }

  return defineMdastPlugin({
    name: 'moraine-examples',
    mdxJsxFlowElement: visitJsxNode,
    mdxJsxTextElement: visitJsxNode,
  })
}
