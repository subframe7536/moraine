import { existsSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineMdastPlugin } from 'satteri'
import type { MdastNode } from 'satteri'

import { resolveDocsPageContext, toImportPath } from '../core/paths'

import { asObjectRecord, getStaticStringAttribute } from './mdx'

export interface ScannedMdxPreview {
  path: string
  importPath: string
}

export type MdxPreviewsPlugin = ReturnType<typeof defineMdastPlugin>

function isPathInside(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath)
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export function resolvePreviewFile(id: string, previewPath: string): string {
  if (
    (!previewPath.startsWith('./') && !previewPath.startsWith('../')) ||
    previewPath.includes('\\')
  ) {
    throw new Error(
      `[docs-mdx] <Preview /> path must be a relative POSIX path in ${id}: ${previewPath}`,
    )
  }
  if (previewPath.includes('?') || previewPath.includes('#')) {
    throw new Error(
      `[docs-mdx] <Preview /> path cannot contain a query or hash in ${id}: ${previewPath}`,
    )
  }

  const extension = path.posix.extname(previewPath)
  if (extension && extension !== '.tsx') {
    throw new Error(
      `[docs-mdx] <Preview /> path must reference a TSX file in ${id}: ${previewPath}`,
    )
  }

  const candidate = path.resolve(path.dirname(id), extension ? previewPath : `${previewPath}.tsx`)
  const pagesRoot = resolveDocsPageContext(id).pagesRoot
  if (!isPathInside(path.resolve(pagesRoot), candidate)) {
    throw new Error(
      `[docs-mdx] <Preview /> path must stay inside docs/pages in ${id}: ${previewPath}`,
    )
  }
  if (!existsSync(candidate)) {
    throw new Error(`[docs-mdx] <Preview /> file not found in ${id}: ${previewPath}`)
  }
  if (!statSync(candidate).isFile()) {
    throw new Error(`[docs-mdx] <Preview /> path is not a file in ${id}: ${previewPath}`)
  }

  const realPagesRoot = realpathSync(pagesRoot)
  const realCandidate = realpathSync(candidate)
  if (!isPathInside(realPagesRoot, realCandidate)) {
    throw new Error(
      `[docs-mdx] <Preview /> path must stay inside docs/pages in ${id}: ${previewPath}`,
    )
  }
  return candidate
}

export function createMdxPreviewsPlugin(id?: string): MdxPreviewsPlugin {
  const previews = new Map<string, ScannedMdxPreview>()

  const visitJsxNode = (node: unknown, ctx: { fileURL?: URL }) => {
    const documentId = id ?? (ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined)
    if (!documentId) {
      throw new Error('[docs-mdx] <Preview /> requires a file URL')
    }
    const record = asObjectRecord(node)
    if (!record || record.name !== 'Preview') {
      return
    }

    const previewPath = getStaticStringAttribute(record, 'Preview', 'path', documentId)?.trim()
    if (!previewPath) {
      throw new Error(`[docs-mdx] <Preview /> requires a static "path" string in ${documentId}`)
    }
    const preview =
      previews.get(previewPath) ??
      (() => {
        const sourcePath = resolvePreviewFile(documentId, previewPath)
        const nextPreview = {
          path: previewPath,
          importPath: `${toImportPath(documentId, sourcePath)}?preview`,
        }
        previews.set(previewPath, nextPreview)
        return nextPreview
      })()

    const attributes = [
      ...(Array.isArray(record.attributes) ? record.attributes : []),
      {
        type: 'mdxJsxAttribute',
        name: 'load',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: `() => import(${JSON.stringify(preview.importPath)})`,
        },
      },
    ]
    return { ...(node as MdastNode), attributes } as MdastNode
  }

  return defineMdastPlugin({
    name: 'moraine-previews',
    mdxJsxFlowElement: visitJsxNode,
    mdxJsxTextElement: visitJsxNode,
  })
}
