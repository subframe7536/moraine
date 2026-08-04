import { fileURLToPath } from 'node:url'

import { defineMdastPlugin } from 'satteri'
import type { MdastNode } from 'satteri'

import { renderDocsCodeHtml } from '../core/expressive-code.ts'

import { asObjectRecord, getStaticStringAttribute } from './mdx.ts'

interface CodeTabItemLiteral {
  label: string
  value: string
  html: string
}

const COMMANDS = [
  { label: 'bun', value: 'bun', source: (name: string) => `bun add ${name}` },
  { label: 'pnpm', value: 'pnpm', source: (name: string) => `pnpm add ${name}` },
  { label: 'npm', value: 'npm', source: (name: string) => `npm i ${name}` },
] as const

async function createCodeTabsItems(packageName: string): Promise<CodeTabItemLiteral[]> {
  return Promise.all(
    COMMANDS.map(async (command) => ({
      label: command.label,
      value: command.value,
      html: await renderDocsCodeHtml({
        code: command.source(packageName),
        language: 'bash',
        props: { frame: 'none', showLineNumbers: false },
      }),
    })),
  )
}

export function createMdxCodeTabsPlugin(id?: string): ReturnType<typeof defineMdastPlugin> {
  const itemsCache = new Map<string, Promise<CodeTabItemLiteral[]>>()

  const visitJsxNode = async (node: unknown, ctx: { fileURL?: URL }) => {
    const documentId = id ?? (ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined)
    if (!documentId) {
      throw new Error('[docs-mdx] <CodeTabs /> requires a file URL')
    }
    const record = asObjectRecord(node)
    if (!record || record.name !== 'CodeTabs') {
      return
    }

    const packageName = getStaticStringAttribute(record, 'CodeTabs', 'package', documentId)?.trim()
    if (!packageName) {
      throw new Error(`[docs-mdx] <CodeTabs /> requires a static "package" string in ${documentId}`)
    }
    const items = await (itemsCache.get(packageName) ??
      (() => {
        const promise = createCodeTabsItems(packageName)
        itemsCache.set(packageName, promise)
        return promise
      })())
    const attributes = [
      ...(Array.isArray(record.attributes) ? record.attributes : []),
      {
        type: 'mdxJsxAttribute',
        name: 'items',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(items),
        },
      },
    ]
    return { ...(node as MdastNode), attributes } as MdastNode
  }

  return defineMdastPlugin({
    name: 'moraine-code-tabs',
    mdxJsxFlowElement: visitJsxNode,
    mdxJsxTextElement: visitJsxNode,
  })
}
