import { defineHastPlugin, defineMdastPlugin } from 'satteri'
import type { HastNode, MdastNode, MdastVisitorContext, MdxJsxAttributeUnion } from 'satteri'

import {
  parseCodeGroupId,
  parseCodeTitle,
  parseHighlightedLines,
  renderDocsCodeHtml,
} from '../core/shiki.ts'
import { toKebabCase } from '../core/strings.ts'

import { readCodeTabSource } from './mdx.ts'
import type { MdxNode } from './mdx.ts'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from './shared.class.ts'

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
          ctx.setProperty(node, 'tabindex', -1)
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

async function renderCodeTabItem(node: MdxNode, source?: string) {
  const item = readCodeTabSource(node, source)
  if (!item) {
    throw new Error('[docs-mdx] invalid CodeTabs item')
  }
  const html = await renderDocsCodeHtml({
    code: item.code,
    language: item.lang,
    highlightedLines: item.highlightedLines,
  })
  return {
    label: item.title,
    title: item.title,
    value: item.title,
    lang: item.lang,
    code: item.code,
    html,
    highlightedLines: item.highlightedLines,
  }
}

async function groupCodeBlocks(node: MdastNode, ctx: MdastVisitorContext): Promise<void> {
  if ('children' in node && Array.isArray(node.children)) {
    let i = 0
    while (i < node.children.length) {
      const child = node.children[i]!
      if (child.type === 'code') {
        const groupId = parseCodeGroupId(child.meta ?? undefined)
        if (groupId) {
          const group = [child]
          let j = i + 1
          while (j < node.children.length) {
            const next = node.children[j]
            if (next?.type === 'code' && parseCodeGroupId(next.meta ?? undefined) === groupId) {
              group.push(next)
              j++
            } else {
              break
            }
          }

          const items = await Promise.all(
            group.map((item) => renderCodeTabItem(item as MdxNode, ctx.source)),
          )

          const codeTabsNode: MdastNode = {
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

          ctx.replaceNode(group[0]!, codeTabsNode)
          for (let k = 1; k < group.length; k++) {
            ctx.removeNode(group[k]!)
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

export function createDocsCodeTabsPlugin(): ReturnType<typeof defineMdastPlugin> {
  return defineMdastPlugin({
    name: 'moraine-docs-code-tabs',
    async before(root, ctx) {
      await groupCodeBlocks(root, ctx)
    },
    async mdxJsxFlowElement(node, ctx) {
      const codeTabs = node as MdxNode
      if (codeTabs.name !== 'CodeTabs') {
        return
      }

      const itemElements = (codeTabs.children ?? []).filter(
        (child) => child.name === 'CodeTabs.Item' || child.type === 'code',
      )
      if (itemElements.length === 0) {
        return
      }

      const items = await Promise.all(
        itemElements.map((child) => renderCodeTabItem(child, ctx.source)),
      )
      const itemsAttribute: MdxJsxAttributeUnion = {
        type: 'mdxJsxAttribute',
        name: 'items',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(items),
        },
      }

      return {
        ...node,
        attributes: [...node.attributes, itemsAttribute],
        children: [],
      }
    },
  })
}
