import { defineHastPlugin, defineMdastPlugin } from 'satteri'
import type { HastNode } from 'satteri'

import { toKebabCase } from '../core/strings'

import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from './shared'
import type { MarkdownHighlightLang } from './types'

export interface OnThisPageEntryLiteral {
  id: string
  label: string
  level: number
}

export const DOCS_MDX_FEATURES = {
  gfm: true,
  frontmatter: true,
  smartPunctuation: true,
}

const MARKDOWN_LANG_ALIASES: Record<string, MarkdownHighlightLang> = {
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  tsx: 'tsx',
  ts: 'tsx',
  typescript: 'tsx',
  jsx: 'tsx',
  css: 'css',
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  javascript: 'javascript',
}

const DEFAULT_TABLE_THEAD_TR_CLASS =
  'text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase'
const DEFAULT_TABLE_TBODY_TR_CLASS = 'b-t b-border hover:bg-muted/50'
const DEFAULT_TABLE_TH_CLASS = 'font-medium px-3 py-2'
const DEFAULT_TABLE_TD_CLASS = 'px-3 py-2'

function normalizeMarkdownLang(value: string | null | undefined): MarkdownHighlightLang | null {
  const key = value?.trim().toLowerCase() ?? ''
  if (!key) {
    return null
  }
  return MARKDOWN_LANG_ALIASES[key] ?? null
}

function toAnchorSlug(value: string): string {
  return toKebabCase(value) || 'section'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function createPlainCodeBlockHtml(source: string): string {
  return `<pre><code>${escapeHtml(source)}</code></pre>`
}

function getNodeProperties(node: HastNode): Record<string, unknown> {
  if (node.type !== 'element') {
    return {}
  }
  return (node.properties ?? {}) as Record<string, unknown>
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

export function createDocsHastPlugin(onThisPageEntries?: OnThisPageEntryLiteral[]) {
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
            onThisPageEntries?.push({
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

export function createDocsCodePlugin(
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
) {
  return defineMdastPlugin({
    name: 'moraine-docs-code',
    code(node) {
      const lang = normalizeMarkdownLang(node.lang)
      const html = lang ? (highlightCode?.(node.value, lang) ?? null) : null
      return {
        type: 'mdxJsxFlowElement',
        name: 'ShikiCodeBlock',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'html',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              value: JSON.stringify(html ?? createPlainCodeBlockHtml(node.value)),
            },
          },
        ],
        children: [],
      }
    },
  })
}
