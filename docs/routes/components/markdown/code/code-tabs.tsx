import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createSignal } from 'solid-js'

import { Tabs, cn } from '../../../../../src/index'
import {
  DOCS_TABS_CONTENT_CLASS,
  DOCS_TABS_INDICATOR_CLASS,
  DOCS_TABS_LIST_CLASS,
  DOCS_TABS_ROOT_CLASS,
  DOCS_TABS_TRIGGER_CLASS,
} from '../markdown.recipe'

import { CodeBlock } from './code-block'
export interface CodeTabItem {
  label?: string
  title?: string
  value?: string
  lang?: string
  code?: string
  html?: string
  highlightedLines?: Array<number> | string
}

export interface CodeTabsProps {
  groupId?: string
  items?: Array<CodeTabItem>
  defaultValue?: string
  class?: string
  style?: JSX.CSSProperties
}

const tabGroupSignals = new Map<string, [Accessor<string>, (val: string) => void]>()

function getGroupSignal(groupId: string, initial: string) {
  let entry = tabGroupSignals.get(groupId)
  if (!entry) {
    const [get, set] = createSignal(initial)
    entry = [get, set]
    tabGroupSignals.set(groupId, entry)
  }
  return entry
}

export function CodeTabs(props: CodeTabsProps) {
  const items = () => props.items ?? []

  const fallbackDefault = () =>
    props.defaultValue ?? items()[0]?.value ?? items()[0]?.title ?? items()[0]?.label

  const groupSignal = () =>
    props.groupId ? getGroupSignal(props.groupId, fallbackDefault() ?? '') : undefined

  const activeValue = () => {
    const gs = groupSignal()
    if (gs) {
      const current = gs[0]()
      if (items().some((it) => (it.value ?? it.title ?? it.label) === current)) {
        return current
      }
    }
    return undefined
  }

  const handleValueChange = (val: string) => {
    const gs = groupSignal()
    if (gs) {
      gs[1](val)
    }
  }

  return (
    <Tabs
      value={activeValue()}
      onValueChange={handleValueChange}
      defaultValue={fallbackDefault()}
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
          content: () => (
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

export const DocsCodeTabs = CodeTabs
