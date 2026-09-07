import { defineHastPlugin, defineMdastPlugin } from 'satteri'
import type { HastNode, MdxJsxAttributeUnion } from 'satteri'

import {
  parseCodeGroupId,
  parseCodeTitle,
  parseHighlightedLines,
  renderDocsCodeHtml,
} from '../core/shiki'
import { toKebabCase } from '../core/strings'

import { asObjectRecord } from './mdx'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from './shared.class'

export interface OnThisPageEntryLiteral {
  id: string
  label: string
  level: number
}

export const DOCS_ON_THIS_PAGE_DATA_KEY = '__moraineOnThisPageEntries'

export const DOCS_MDX_FEATURES = {
  gfm: true,
  frontmatter: true,
  smartPunctuation: true,
}

const DEFAULT_TABLE_THEAD_TR_CLASS =
  'text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase'
const DEFAULT_TABLE_TBODY_TR_CLASS = 'b-t b-border hover:bg-muted/50'
const DEFAULT_TABLE_TH_CLASS = 'font-medium px-3 py-2'
const DEFAULT_TABLE_TD_CLASS = 'px-3 py-2'

function toAnchorSlug(value: string): string {
  return toKebabCase(value) || 'section'
}

function getNodeProperties(node: HastNode): Record<string, unknown> {
  if (node.type !== 'element') {
    return {}
  }
  return node.properties ?? {}
}

function getClassValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join(' ')
  }
  return ''
}

function appendClass(node: HastNode, className: string): string {
  const current = getClassValue(getNodeProperties(node).class)
  return current ? `${current} ${className}` : className
}

export function createDocsHastPlugin() {
  const headingSlugCounter = new Map<string, number>()

  const createHeadingSlug = (headingText: string) => {
    const baseSlug = toAnchorSlug(headingText)
    const currentCount = headingSlugCounter.get(baseSlug) ?? 0
    const nextCount = currentCount + 1
    headingSlugCounter.set(baseSlug, nextCount)
    return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
  }

  return defineHastPlugin({
    name: 'moraine-docs-hast',
    element: [
      {
        filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        visit(node, ctx) {
          const level = Number.parseInt(node.tagName.replace('h', ''), 10)
          const headingText = ctx.textContent(node).trim()
          const slug = createHeadingSlug(headingText)

          ctx.setProperty(node, 'id', slug)
          ctx.setProperty(
            node,
            'class',
            appendClass(node, `${MARKDOWN_ANCHOR_HEADING_CLASS} docs-h${level}`),
          )

          if (level >= 2 && level <= 5 && headingText) {
            const entries = (ctx.data[DOCS_ON_THIS_PAGE_DATA_KEY] ??=
              []) as OnThisPageEntryLiteral[]
            entries.push({
              id: slug,
              label: headingText,
              level: level - 1,
            })
          }

          ctx.appendChild(node, {
            type: 'element',
            tagName: 'a',
            properties: {
              class: MARKDOWN_ANCHOR_LINK_CLASS,
              href: `#${slug}`,
              'aria-label': DOCS_HEADING_ANCHOR_ARIA_LABEL,
            },
            children: [{ type: 'text', value: '#' }],
          })
        },
      },
      {
        filter: ['p'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-p'))
        },
      },
      {
        filter: ['ul'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-ul'))
        },
      },
      {
        filter: ['ol'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-ol'))
        },
      },
      {
        filter: ['li'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-li'))
        },
      },
      {
        filter: ['a'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-a'))
        },
      },
      {
        filter: ['code'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-inline-code'))
        },
      },
      {
        filter: ['blockquote'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-blockquote'))
        },
      },
      {
        filter: ['strong'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-strong'))
        },
      },
      {
        filter: ['hr'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'docs-hr'))
        },
      },
      {
        filter: ['table'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, 'text-sm m-0 w-full border-collapse'))
          ctx.wrapNode(node, {
            type: 'element',
            tagName: 'div',
            properties: {
              class: 'my-6 b-1 b-border rounded-lg overflow-x-auto',
            },
            children: [],
          })
        },
      },
      {
        filter: ['tr'],
        visit(node, ctx) {
          const parent = ctx.parent(node)
          const isThead =
            parent?.type === 'element' && 'tagName' in parent && parent.tagName === 'thead'
          ctx.setProperty(
            node,
            'class',
            appendClass(
              node,
              isThead ? DEFAULT_TABLE_THEAD_TR_CLASS : DEFAULT_TABLE_TBODY_TR_CLASS,
            ),
          )
        },
      },
      {
        filter: ['th'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, DEFAULT_TABLE_TH_CLASS))
        },
      },
      {
        filter: ['td'],
        visit(node, ctx) {
          ctx.setProperty(node, 'class', appendClass(node, DEFAULT_TABLE_TD_CLASS))
        },
      },
    ],
  })
}

export function createDocsCodePlugin() {
  return defineMdastPlugin({
    name: 'moraine-docs-code',
    async code(node) {
      const meta = node.meta ?? undefined
      const title = parseCodeTitle(meta)
      const highlightedLines = [...parseHighlightedLines(meta)]
      const html = await renderDocsCodeHtml({
        code: node.value,
        language: node.lang ?? '',
        meta,
        highlightedLines,
      })

      const attributes: MdxJsxAttributeUnion[] = [
        {
          type: 'mdxJsxAttribute',
          name: 'html',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(html),
          },
        },
        {
          type: 'mdxJsxAttribute',
          name: 'code',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(node.value),
          },
        },
        {
          type: 'mdxJsxAttribute',
          name: 'lang',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(node.lang ?? ''),
          },
        },
      ]

      if (title) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'title',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(title),
          },
        })
      }

      if (highlightedLines.length > 0) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'highlightedLines',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(highlightedLines),
          },
        })
      }

      return {
        type: 'mdxJsxFlowElement',
        name: 'CodeBlock',
        attributes,
        children: [],
      }
    },
  })
}

function extractNodeText(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return ''
  }
  const rec = node as Record<string, unknown>
  if (typeof rec.value === 'string') {
    return rec.value
  }
  if (Array.isArray(rec.children)) {
    return rec.children.map(extractNodeText).join('')
  }
  return ''
}

function getJsxAttributeValue(attributes: unknown, name: string): unknown {
  if (!Array.isArray(attributes)) {
    return undefined
  }
  const attr = attributes.find((a: any) => a?.type === 'mdxJsxAttribute' && a?.name === name)
  if (!attr) {
    return undefined
  }
  const val = attr.value
  if (val && typeof val === 'object' && val.type === 'mdxJsxAttributeValueExpression') {
    try {
      return JSON.parse(val.value)
    } catch {
      return val.value
    }
  }
  return val
}

function extractExpressionCode(exprNode: unknown, fullSource?: string): string {
  const record = asObjectRecord(exprNode)
  const pos = asObjectRecord(record?.position)
  const start = asObjectRecord(pos?.start)
  const end = asObjectRecord(pos?.end)
  if (
    typeof start?.offset === 'number' &&
    typeof end?.offset === 'number' &&
    typeof fullSource === 'string'
  ) {
    let raw = fullSource.slice(start.offset, end.offset).trim()
    if (raw.startsWith('{') && raw.endsWith('}')) {
      raw = raw.slice(1, -1).trim()
    }
    if (raw.startsWith('`') && raw.endsWith('`')) {
      raw = raw.slice(1, -1)
    }
    return raw.replace(/^\r?\n/, '').replace(/\r?\n$/, '')
  }
  let val = (typeof record?.value === 'string' ? record.value : '').trim()
  if (val.startsWith('`') && val.endsWith('`')) {
    val = val.slice(1, -1)
  }
  return val
}

async function renderCodeTabItem(node: any) {
  const meta = node.meta ?? undefined
  const title = parseCodeTitle(meta) ?? node.lang ?? 'code'
  const highlightedLines = [...parseHighlightedLines(meta)]
  const html = await renderDocsCodeHtml({
    code: node.value,
    language: node.lang ?? '',
    meta,
    highlightedLines,
  })
  return {
    label: title,
    title,
    value: title,
    lang: node.lang ?? '',
    code: node.value,
    html,
    highlightedLines,
  }
}

async function groupCodeBlocks(node: unknown, ctx: any): Promise<void> {
  if (!node || typeof node !== 'object') {
    return
  }

  const record = node as Record<string, unknown>
  if (Array.isArray(record.children)) {
    let i = 0
    while (i < record.children.length) {
      const child = record.children[i]
      if (child?.type === 'code') {
        const groupId = parseCodeGroupId(child.meta)
        if (groupId) {
          const group = [child]
          let j = i + 1
          while (j < record.children.length) {
            const next = record.children[j]
            if (next?.type === 'code' && parseCodeGroupId(next.meta) === groupId) {
              group.push(next)
              j++
            } else {
              break
            }
          }

          const items = await Promise.all(group.map(renderCodeTabItem))

          const codeTabsNode = {
            type: 'mdxJsxFlowElement',
            name: 'CodeTabs',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'groupId',
                value: groupId,
              },
              {
                type: 'mdxJsxAttribute',
                name: 'items',
                value: {
                  type: 'mdxJsxAttributeValueExpression',
                  value: JSON.stringify(items),
                },
              },
            ],
            children: [],
          }

          ctx.replaceNode(group[0], codeTabsNode)
          for (let k = 1; k < group.length; k++) {
            ctx.removeNode(group[k])
          }

          i = j
          continue
        }
      }

      await groupCodeBlocks(child, ctx)
      i++
    }
  }
}

export function createDocsCodeTabsPlugin() {
  return defineMdastPlugin({
    name: 'moraine-docs-code-tabs',
    async before(root, ctx) {
      await groupCodeBlocks(root, ctx)
    },
    async mdxJsxFlowElement(node, ctx) {
      const record = asObjectRecord(node)
      if (!record || record.name !== 'CodeTabs') {
        return
      }

      const children = Array.isArray(record.children) ? record.children : []
      const itemElements = children.filter(
        (child: any) => child?.name === 'CodeTabs.Item' || child?.type === 'code',
      )
      if (itemElements.length === 0) {
        return
      }

      const transformedChildren: any[] = []
      const items = await Promise.all(
        itemElements.map(async (child: any) => {
          if (child.type === 'code') {
            return renderCodeTabItem(child)
          }

          const attrs = child.attributes
          let lang = (getJsxAttributeValue(attrs, 'lang') ?? '') as string
          let title = (getJsxAttributeValue(attrs, 'title') ?? '') as string
          const rawHighlighted = getJsxAttributeValue(attrs, 'highlightedLines')
          let highlightedLines = [...parseHighlightedLines(undefined, rawHighlighted as any)]
          let code = (getJsxAttributeValue(attrs, 'code') ?? '') as string

          const subChildren = Array.isArray(child.children) ? child.children : []
          const codeChild = subChildren.find((c: any) => c?.type === 'code')
          if (codeChild) {
            code = codeChild.value
            if (!lang && codeChild.lang) {
              lang = codeChild.lang
            }
            if (!title && codeChild.meta) {
              title = parseCodeTitle(codeChild.meta) ?? ''
            }
            if (highlightedLines.length === 0 && codeChild.meta) {
              highlightedLines = [...parseHighlightedLines(codeChild.meta)]
            }
          } else if (!code) {
            const exprChild = subChildren.find(
              (c: any) => c?.type === 'mdxFlowExpression' || c?.type === 'mdxTextExpression',
            )
            if (exprChild) {
              code = extractExpressionCode(exprChild, ctx?.source)
            } else {
              code = extractNodeText(child).trim()
            }
          }

          const parsedTitle = title || lang || 'code'
          const html = await renderDocsCodeHtml({
            code,
            language: lang,
            highlightedLines,
          })

          const itemObj = {
            label: parsedTitle,
            title: parsedTitle,
            value: parsedTitle,
            lang,
            code,
            html,
            highlightedLines,
          }

          transformedChildren.push({
            type: 'mdxJsxFlowElement',
            name: 'CodeTabs.Item',
            attributes: [
              { type: 'mdxJsxAttribute', name: 'lang', value: lang },
              { type: 'mdxJsxAttribute', name: 'title', value: parsedTitle },
              {
                type: 'mdxJsxAttribute',
                name: 'code',
                value: {
                  type: 'mdxJsxAttributeValueExpression',
                  value: JSON.stringify(code),
                },
              },
              {
                type: 'mdxJsxAttribute',
                name: 'html',
                value: {
                  type: 'mdxJsxAttributeValueExpression',
                  value: JSON.stringify(html),
                },
              },
              ...(highlightedLines.length > 0
                ? [
                    {
                      type: 'mdxJsxAttribute',
                      name: 'highlightedLines',
                      value: {
                        type: 'mdxJsxAttributeValueExpression',
                        value: JSON.stringify(highlightedLines),
                      },
                    },
                  ]
                : []),
            ],
            children: [],
          })

          return itemObj
        }),
      )

      return {
        ...(node as any),
        attributes: [
          ...(Array.isArray(record.attributes) ? record.attributes : []),
          {
            type: 'mdxJsxAttribute',
            name: 'items',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              value: JSON.stringify(items),
            },
          },
        ],
        children: transformedChildren,
      }
    },
  })
}
