import type { MDXComponents } from 'solid-file-router/mdx'
import type { Component, JSX } from 'solid-js'
import { createResource, onMount, Show } from 'solid-js'

import { Tabs } from '../../../../src/index.ts'

import { DocsCodeBlock as DocsCodeBlockView } from './docs-code-block.tsx'
import { DocsDemoBlock } from './docs-demo-block.tsx'
import { DocsPlayground as Playground } from './docs-playground.tsx'
import { IntroComponents } from './intro-components.tsx'
import { Markdown } from './markdown.tsx'
import type { DocsMdxCodeTabItem } from './markdown.tsx'
import { ToastHosts } from './toast-hosts.tsx'

const DOCS_INSTALL_TABS_ROOT_CLASS =
  'my-3 gap-0 border border-border/60 rounded-xl bg-card/40 overflow-hidden'
const DOCS_INSTALL_TABS_LIST_CLASS =
  'p-1.5 w-full justify-start rounded-none border-b border-border/60 bg-muted/40 overflow-x-auto'
const DOCS_INSTALL_TABS_INDICATOR_CLASS =
  'border border-border/60 bg-background shadow-none rounded-lg'
const DOCS_INSTALL_TABS_TRIGGER_CLASS =
  'text-xs px-3 py-1 flex-none z-base rounded-lg text-muted-foreground data-selected:text-foreground data-selected:font-medium hover:not-disabled:text-foreground active:not-disabled:scale-[0.98] transition-[color,transform] duration-150'
const DOCS_INSTALL_TABS_CONTENT_CLASS = 'p-0'

interface MdxProps {
  [key: string]: unknown
}

export interface DocsMdxExample {
  component?: Component
  source?: string
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function MdxButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />
}

export const DOCS_MDX_COMPONENTS: MDXComponents = {
  Markdown,

  button: MdxButton,

  Playground,

  Example(props: MdxProps) {
    const [descriptor, { refetch }] = createResource(() => {
      const loader = props.load
      if (typeof loader !== 'function') {
        throw new TypeError('[docs-mdx] compiled example is missing its loader')
      }
      return (loader as () => Promise<{ default: DocsMdxExample }>)().then((module) => {
        const descriptor = module.default
        return import.meta.env.SSR ? { source: descriptor.source } : descriptor
      })
    })

    // Component functions cannot be serialized into the SSR resource payload. The
    // client must refetch after hydration to replace the source-only descriptor.
    onMount(() => {
      refetch()
    })

    return (
      <Show when={descriptor()}>
        {(value) => <DocsDemoBlock component={value().component} source={value().source} />}
      </Show>
    )
  },

  CodeTabs(props: MdxProps) {
    const items = () => {
      const value = props.items
      return Array.isArray(value) ? (value as DocsMdxCodeTabItem[]) : []
    }

    return (
      <Tabs
        defaultValue={items()[0]?.value}
        size="sm"
        class={DOCS_INSTALL_TABS_ROOT_CLASS}
        classes={{
          list: DOCS_INSTALL_TABS_LIST_CLASS,
          indicator: DOCS_INSTALL_TABS_INDICATOR_CLASS,
          content: DOCS_INSTALL_TABS_CONTENT_CLASS,
          trigger: DOCS_INSTALL_TABS_TRIGGER_CLASS,
        }}
        items={items().map((item) => ({
          label: item.label,
          value: item.value,
          content: <DocsCodeBlockView variant="install" html={item.html} />,
        }))}
      />
    )
  },

  IntroComponents,

  ToastHosts,

  DocsCodeBlock(props: MdxProps) {
    const html = () => {
      const value = toStringProp(props.html)
      if (!value) {
        throw new Error('[docs-mdx] compiled code block is missing rendered HTML')
      }
      return value
    }
    return <DocsCodeBlockView html={html()} />
  },
}
