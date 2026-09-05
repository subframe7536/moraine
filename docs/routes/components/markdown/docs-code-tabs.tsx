import type { JSX } from 'solid-js'
import { children, createMemo } from 'solid-js'

import { Tabs, cn } from '../../../../src/index'

import { CodeBlock } from './docs-code-block'

export interface CodeTabItem {
  label?: string
  title?: string
  value?: string
  lang?: string
  code?: string
  html?: string
  highlightedLines?: number[] | string
}

export interface CodeTabsItemProps extends CodeTabItem {
  children?: JSX.Element
}

export function CodeTabsItem(props: CodeTabsItemProps) {
  return {
    kind: 'CodeTabs.Item',
    props,
  } as unknown as JSX.Element
}

export interface CodeTabsProps {
  items?: CodeTabItem[]
  defaultValue?: string
  class?: string
  style?: JSX.CSSProperties
  children?: JSX.Element
}

const DOCS_TABS_ROOT_CLASS =
  'my-4 gap-0 border border-border/70 rounded-xl bg-card/40 overflow-hidden shadow-xs'
const DOCS_TABS_LIST_CLASS =
  'p-1.5 w-full justify-start rounded-none border-b border-border/60 bg-muted/40 overflow-x-auto'
const DOCS_TABS_INDICATOR_CLASS = 'border border-border/60 bg-background shadow-none rounded-lg'
const DOCS_TABS_TRIGGER_CLASS =
  'text-xs px-3 py-1 flex-none z-base rounded-lg text-muted-foreground data-selected:text-foreground data-selected:font-medium hover:not-disabled:text-foreground active:not-disabled:scale-[0.98] transition-[color,transform] duration-150'
const DOCS_TABS_CONTENT_CLASS = 'p-0 relative'

export function CodeTabs(props: CodeTabsProps) {
  const resolvedChildren = children(() => props.children)
  const items = createMemo<CodeTabItem[]>(() => {
    if (props.items && props.items.length > 0) {
      return props.items
    }
    const list: CodeTabItem[] = []
    const raw = resolvedChildren()
    const childArray = Array.isArray(raw) ? raw : raw ? [raw] : []
    for (const child of childArray) {
      if (!child) {
        continue
      }
      if (typeof child === 'object' && child !== null && 'props' in child) {
        const itemProps = (child as any).props as CodeTabsItemProps
        const childContent = itemProps.children
        let codeText = itemProps.code
        if (!codeText) {
          if (typeof childContent === 'string') {
            codeText = childContent.trim()
          } else if (Array.isArray(childContent)) {
            codeText = childContent
              .map((c) => (typeof c === 'string' ? c : ''))
              .join('')
              .trim()
          }
        }
        const val = itemProps.value ?? itemProps.title ?? itemProps.label ?? itemProps.lang ?? ''
        const title = itemProps.title ?? itemProps.label ?? itemProps.lang
        list.push({
          label: itemProps.label ?? title ?? val,
          title,
          value: val,
          lang: itemProps.lang,
          code: codeText,
          html: itemProps.html,
          highlightedLines: itemProps.highlightedLines,
        })
      }
    }
    return list
  })

  const defaultValue = () =>
    props.defaultValue ?? items()[0]?.value ?? items()[0]?.title ?? items()[0]?.label

  return (
    <Tabs
      defaultValue={defaultValue()}
      size="sm"
      class={cn(DOCS_TABS_ROOT_CLASS, props.class)}
      style={props.style}
      classes={{
        list: DOCS_TABS_LIST_CLASS,
        indicator: DOCS_TABS_INDICATOR_CLASS,
        content: DOCS_TABS_CONTENT_CLASS,
        trigger: DOCS_TABS_TRIGGER_CLASS,
      }}
      items={items().map((item) => {
        const val = item.value ?? item.title ?? item.label ?? ''
        const label = item.label ?? item.title ?? val
        return {
          label,
          value: val,
          content: (
            <CodeBlock
              variant="tabs"
              lang={item.lang}
              code={item.code}
              html={item.html}
              highlightedLines={item.highlightedLines}
            />
          ),
        }
      })}
    />
  )
}

CodeTabs.Item = CodeTabsItem

export const DocsCodeTabs = CodeTabs
