import { parseCodeTitle, parseHighlightedLines } from '../core/shiki.ts'

export interface MdxNode {
  type?: string
  name?: string
  attributes?: unknown[]
  children?: MdxNode[]
  value?: string
  lang?: string
  meta?: string
  position?: {
    start?: { offset?: number }
    end?: { offset?: number }
  }
}

export interface CodeTabSource {
  lang: string
  title: string
  code: string
  highlightedLines: number[]
}

export function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export function getMdxAttributeValue(node: MdxNode, name: string): unknown {
  const attribute = node.attributes
    ?.map(asObjectRecord)
    .find((item) => item?.type === 'mdxJsxAttribute' && item.name === name)
  if (!attribute) {
    return undefined
  }
  const value = asObjectRecord(attribute.value)
  if (value?.type === 'mdxJsxAttributeValueExpression' && typeof value.value === 'string') {
    try {
      return JSON.parse(value.value)
    } catch {
      return value.value
    }
  }
  return attribute.value
}

export function extractMdxExpressionCode(node: MdxNode, source?: string): string {
  const start = node.position?.start?.offset
  const end = node.position?.end?.offset
  if (typeof start === 'number' && typeof end === 'number' && source) {
    let raw = source.slice(start, end).trim()
    if (raw.startsWith('{') && raw.endsWith('}')) {
      raw = raw.slice(1, -1).trim()
    }
    if (raw.startsWith('`') && raw.endsWith('`')) {
      raw = raw.slice(1, -1)
    }
    return raw.replace(/^\r?\n/, '').replace(/\r?\n$/, '')
  }
  const value = node.value?.trim() ?? ''
  return value.startsWith('`') && value.endsWith('`') ? value.slice(1, -1) : value
}

export function extractMdxNodeText(node: MdxNode): string {
  if (typeof node.value === 'string') {
    return node.value
  }
  return node.children?.map(extractMdxNodeText).join('') ?? ''
}

export function readCodeTabSource(node: MdxNode, source?: string): CodeTabSource | null {
  if (node.type === 'code') {
    const title = parseCodeTitle(node.meta) ?? node.lang ?? 'code'
    return {
      lang: node.lang ?? '',
      title,
      code: node.value ?? '',
      highlightedLines: [...parseHighlightedLines(node.meta)],
    }
  }
  if (node.name !== 'CodeTabs.Item') {
    return null
  }

  const langAttribute = getMdxAttributeValue(node, 'lang')
  const titleAttribute = getMdxAttributeValue(node, 'title')
  const codeAttribute = getMdxAttributeValue(node, 'code')
  let lang = typeof langAttribute === 'string' ? langAttribute : ''
  let title = typeof titleAttribute === 'string' ? titleAttribute : ''
  let code = typeof codeAttribute === 'string' ? codeAttribute : ''
  const explicitHighlightedLines = getMdxAttributeValue(node, 'highlightedLines')
  let highlightedLines = [
    ...parseHighlightedLines(
      undefined,
      Array.isArray(explicitHighlightedLines) || typeof explicitHighlightedLines === 'string'
        ? (explicitHighlightedLines as number[] | string)
        : undefined,
    ),
  ]
  const codeChild = node.children?.find((child) => child.type === 'code')
  if (codeChild) {
    code = codeChild.value ?? ''
    lang ||= codeChild.lang ?? ''
    title ||= parseCodeTitle(codeChild.meta) ?? ''
    if (highlightedLines.length === 0) {
      highlightedLines = [...parseHighlightedLines(codeChild.meta)]
    }
  } else if (!code) {
    const expression = node.children?.find(
      (child) => child.type === 'mdxFlowExpression' || child.type === 'mdxTextExpression',
    )
    code = expression
      ? extractMdxExpressionCode(expression, source)
      : extractMdxNodeText(node).trim()
  }

  return { lang, title: title || lang || 'code', code, highlightedLines }
}

export function getStaticStringAttribute(
  node: Record<string, unknown>,
  componentName: string,
  attributeName: string,
  id: string,
): string | null {
  const attributes = Array.isArray(node.attributes) ? node.attributes : []
  const attribute = attributes.map(asObjectRecord).find((item) => item?.name === attributeName)
  if (!attribute) {
    return null
  }

  if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.name !== 'string') {
    throw new Error(`[docs-mdx] unsupported JSX attribute in ${id}`)
  }

  if (typeof attribute.value === 'string') {
    return attribute.value
  }

  throw new Error(
    `[docs-mdx] <${componentName} /> requires a static "${attributeName}" string in ${id}`,
  )
}
