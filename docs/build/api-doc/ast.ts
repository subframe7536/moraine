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
  comments: Array<SourceComment>
}

export interface JsDoc {
  description?: string
  defaultValue?: string
  /** Code of each `@example` tag, without fences. */
  examples?: Array<string>
}

const PARSE_OPTIONS = {
  sourceType: 'module',
} satisfies ParserOptions

export async function parseTypeScript(
  fileName: string,
  text: string,
  lang: 'ts' | 'tsx',
): Promise<ParsedSource> {
  const result = await parse(fileName, text, {
    ...PARSE_OPTIONS,
    lang: /\.d\.(?:ts|mts|cts)$/.test(fileName) ? 'dts' : lang,
  })
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

export function nodeText(source: ParsedSource, node: Pick<AstNode, 'start' | 'end'>): string {
  return source.text.slice(node.start, node.end)
}

function cleanJsDocValue(value: string): Array<string> {
  const lines = value.replace(/^\*/, '').split(/\r?\n/g)
  return lines.map((line) => line.replace(/^\s*\* ?/, '').trimEnd())
}

interface JsDocTag {
  name: string
  body: string
}

/** Split JSDoc text into its description and `@tag` sections, ignoring `@` inside code fences. */
function splitJsDocTags(text: string): { description: string; tags: Array<JsDocTag> } {
  const fences = [...text.matchAll(/```[\s\S]*?(?:```|$)/g)].map(
    (match) => [match.index, match.index + match[0].length] as const,
  )
  const inFence = (index: number) => fences.some(([from, to]) => index >= from && index < to)
  const starts = [...text.matchAll(/(?:^|\s)@(\w+)/g)]
    .filter((match) => !inFence(match.index + match[0].indexOf('@')))
    .map((match) => ({
      name: match[1] ?? '',
      at: match.index,
      bodyAt: match.index + match[0].length,
    }))
  const tags = starts.map((start, index) => ({
    name: start.name,
    body: text.slice(start.bodyAt, starts[index + 1]?.at ?? text.length).trim(),
  }))
  return { description: text.slice(0, starts[0]?.at ?? text.length).trim(), tags }
}

/** The code of an `@example` tag: the fenced block when present, otherwise the tag body. */
function exampleCode(body: string): string {
  const fenced = body.match(/```[^\n]*\n([\s\S]*?)\n?```/)
  return (fenced?.[1] ?? body).trim()
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

  const text = cleanJsDocValue(comment.value).join('\n').trim()
  const { description, tags } = splitJsDocTags(text)
  const defaultValue = tags
    .find((tag) => tag.name === 'default' || tag.name === 'defaultValue')
    ?.body.split('\n')[0]
    ?.trim()
  const examples = tags
    .filter((tag) => tag.name === 'example')
    .map((tag) => exampleCode(tag.body))
    .filter(Boolean)

  return {
    ...(description ? { description } : {}),
    ...(defaultValue ? { defaultValue } : {}),
    ...(examples.length > 0 ? { examples } : {}),
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
