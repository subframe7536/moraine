import { parse } from 'vite'
import type { ESTree, ParserOptions } from 'vite'

export type AstNode = ESTree.Node
export type ProgramNode = ESTree.Program

interface SourceComment {
  type: 'Block' | 'Line'
  value: string
  start: number
  end: number
}

export interface ParsedSource {
  fileName: string
  text: string
  program: ProgramNode
  comments: SourceComment[]
}

export interface JsDoc {
  description?: string
  defaultValue?: string
}

const PARSE_OPTIONS = {
  sourceType: 'module',
} satisfies ParserOptions

export async function parseTypeScript(
  fileName: string,
  text: string,
  lang: 'ts' | 'tsx',
): Promise<ParsedSource> {
  const result = await parse(fileName, text, { ...PARSE_OPTIONS, lang })
  if (result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join('\n')
    throw new Error(`Failed to parse ${fileName}:\n${message}`)
  }

  return {
    fileName,
    text,
    program: result.program,
    comments: result.comments,
  }
}

function isAstNode(value: unknown): value is AstNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { start?: unknown }).start === 'number' &&
    typeof (value as { end?: unknown }).end === 'number'
  )
}

export function walkAst(root: unknown, visit: (node: AstNode) => void): void {
  if (Array.isArray(root)) {
    for (const value of root) {
      walkAst(value, visit)
    }
    return
  }

  if (!isAstNode(root)) {
    return
  }

  visit(root)
  for (const [key, value] of Object.entries(root)) {
    if (key !== 'comments' && key !== 'parent') {
      walkAst(value, visit)
    }
  }
}

export function nodeText(source: ParsedSource, node: Pick<AstNode, 'start' | 'end'>): string {
  return source.text.slice(node.start, node.end)
}

function cleanJsDocValue(value: string): string[] {
  const lines = value.replace(/^\*/, '').split(/\r?\n/g)
  return lines.map((line) => line.replace(/^\s*\* ?/, '').trimEnd())
}

export function getJsDoc(source: ParsedSource, node: Pick<AstNode, 'start'>): JsDoc {
  const comment = source.comments.findLast((candidate) => {
    if (
      candidate.type !== 'Block' ||
      !candidate.value.startsWith('*') ||
      candidate.end > node.start
    ) {
      return false
    }

    const gap = source.text.slice(candidate.end, node.start).trim()
    return /^(?:(?:export|declare)\s*)*$/.test(gap)
  })

  if (!comment) {
    return {}
  }

  const lines = cleanJsDocValue(comment.value)
  const text = lines.join('\n').trim()
  const defaultMatch = text.match(/(?:^|\s)@default(?:Value)?\s+([^\n]*)/)
  const description = text
    .replace(/(?:^|\s)@\w+(?:\s+[^\n]*)?/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
  const defaultValue = defaultMatch?.[1]?.trim().replace(/^['"]|['"]$/g, '')

  return {
    ...(description ? { description } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
  }
}

export function getIdentifierName(node: unknown): string | undefined {
  if (!isAstNode(node)) {
    return undefined
  }
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    return (node as { name: string }).name
  }
  if (node.type === 'Literal') {
    const value = (node as { value: unknown }).value
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

export function entityNameToText(node: unknown): string | undefined {
  const name = getIdentifierName(node)
  if (name) {
    return name
  }
  if (!isAstNode(node)) {
    return undefined
  }
  if (node.type === 'TSQualifiedName') {
    const left = entityNameToText(node.left)
    const right = entityNameToText(node.right)
    return left && right ? `${left}.${right}` : undefined
  }
  if (node.type === 'MemberExpression') {
    const object = entityNameToText(node.object)
    const property = entityNameToText(node.property)
    return object && property ? `${object}.${property}` : undefined
  }
  return undefined
}
