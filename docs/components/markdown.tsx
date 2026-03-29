import type { Component } from 'solid-js'
import { For, Show, Switch, Match } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'
import { useTableOfContents } from '../hooks/use-table-of-contents'
import type { OnThisPageEntry } from '../hooks/use-table-of-contents'
import type { ItemsDoc } from '../vite-plugin/api-doc/types'

import { DocsApiReference } from './docs-api-reference'
import { DocsHeader } from './docs-header'
import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import { ShikiCodeBlock } from './shiki-code-block'
import { ToastHosts } from './toast-hosts'

interface ComponentIndexEntry {
  name: string
  key: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
}

interface ComponentPropDoc {
  name: string
  required: boolean
  type: string
  description?: string
  defaultValue?: string
}

interface ComponentPropsDoc {
  own: ComponentPropDoc[]
  inherited: {
    from: string
    props: ComponentPropDoc[]
  }[]
}

export interface ExamplePageApiDoc {
  component: ComponentIndexEntry
  slots: string[]
  props: ComponentPropsDoc
  items?: ItemsDoc
}

interface MarkdownRenderSegment {
  type: 'markdown'
  html: string
}

interface ExampleRenderSegment {
  type: 'example'
  component: Component
  code?: string
}

interface WidgetRenderSegment {
  type: 'docs-header' | 'docs-api-reference' | 'intro-cards' | 'intro-components' | 'toast-hosts'
  props?: Record<string, unknown>
}

interface CodeTabsRenderSegment {
  type: 'code-tabs'
  items: {
    label: string
    value: string
    html: string
  }[]
}

type RenderSegment =
  | MarkdownRenderSegment
  | ExampleRenderSegment
  | WidgetRenderSegment
  | CodeTabsRenderSegment

export interface RenderExampleMarkdownPageInput {
  componentKey?: string
  apiDoc?: ExamplePageApiDoc
  kobalteHref?: string
  onThisPageEntries?: OnThisPageEntry[]
  segments: RenderSegment[]
}

function getOnThisPageIndentStyle(level: number) {
  const indentLevel = Math.max(0, level - 1)
  return { 'padding-inline-start': `${indentLevel * 0.75}rem` }
}

const SegmentRenderer = (props: {
  segment: RenderSegment
  pageContext: RenderExampleMarkdownPageInput
}) => {
  return (
    <Switch
      fallback={
        <div class="text-sm text-muted-foreground p-4 b-1 b-border rounded-xl border-dashed">
          Unsupported segment type
        </div>
      }
    >
      <Match
        when={props.segment.type === 'markdown' ? (props.segment as MarkdownRenderSegment) : false}
      >
        {(segment) => (
          <div
            class="max-w-none prose prose-neutral prose-headings:(text-foreground font-semibold mb-3 mt-8) prose-p:(text-muted-foreground leading-6) prose-pre:(b-1 b-border rounded-xl bg-muted) dark:prose-invert"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={segment().html}
          />
        )}
      </Match>
      <Match
        when={props.segment.type === 'example' ? (props.segment as ExampleRenderSegment) : false}
      >
        {(segment) => (
          <section class="b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden">
            <div class="p-6 flex items-center justify-center">
              <Dynamic component={segment().component} />
            </div>
            <Show when={segment().code}>
              <ShikiCodeBlock html={segment().code!} class="border-t border-border bg-muted/70" />
            </Show>
          </section>
        )}
      </Match>
      <Match
        when={props.segment.type === 'code-tabs' ? (props.segment as CodeTabsRenderSegment) : false}
      >
        {(segment) => (
          <Tabs
            defaultValue={segment().items[0]?.value}
            variant="link"
            size="sm"
            classes={{
              list: 'w-fit',
              content: 'pt-1 [&_pre]:rounded-lg',
              trigger: 'flex-none',
            }}
            items={segment().items.map((item) => ({
              label: item.label,
              value: item.value,
              content: <ShikiCodeBlock variant="source" html={item.html} />,
            }))}
          />
        )}
      </Match>
      <Match
        when={props.segment.type === 'docs-header' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => (
          <DocsHeader
            componentKey={props.pageContext.componentKey}
            apiDoc={props.pageContext.apiDoc}
            kobalteHref={props.pageContext.kobalteHref}
            {...segment().props}
          />
        )}
      </Match>
      <Match
        when={
          props.segment.type === 'docs-api-reference'
            ? (props.segment as WidgetRenderSegment)
            : false
        }
      >
        {(segment) => <DocsApiReference apiDoc={props.pageContext.apiDoc} {...segment().props} />}
      </Match>
      <Match
        when={props.segment.type === 'intro-cards' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => <IntroCards {...segment().props} />}
      </Match>
      <Match
        when={
          props.segment.type === 'intro-components' ? (props.segment as WidgetRenderSegment) : false
        }
      >
        {(segment) => <IntroComponents {...segment().props} />}
      </Match>
      <Match
        when={props.segment.type === 'toast-hosts' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => <ToastHosts {...segment().props} />}
      </Match>
    </Switch>
  )
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const onThisPageEntries = () => input.onThisPageEntries ?? []
  const { activeId } = useTableOfContents(onThisPageEntries)

  return (
    <main class="text-foreground px-4 py-8 min-h-screen w-full sm:(px-8 py-16)">
      <div class="mx-auto flex gap-8 max-w-7xl items-start">
        <div class="flex-1 min-w-0">
          <div class="mx-auto flex flex-col gap-4 max-w-4xl">
            <For each={input.segments}>
              {(segment) => <SegmentRenderer segment={segment} pageContext={input} />}
            </For>
          </div>
        </div>

        <aside class="p-4 shrink-0 max-h-[calc(100vh-4rem)] w-60 hidden self-start top-8 sticky overflow-y-auto xl:block">
          <p class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
            On This Page
          </p>
          <Show
            when={onThisPageEntries().length > 0}
            fallback={<p class="text-xs text-muted-foreground mt-3">No sections</p>}
          >
            <nav aria-label="On This Page" class="mt-3 flex flex-col gap-1">
              <For each={onThisPageEntries()}>
                {(entry) => (
                  <a
                    href={`#${entry.id}`}
                    aria-current={activeId() === entry.id ? 'location' : undefined}
                    class="text-sm text-muted-foreground leading-8 px-2 b-(1 transparent) rounded-md h-8 aria-current:(text-foreground b-border bg-accent/60) hover:text-foreground"
                  >
                    <span class="block truncate" style={getOnThisPageIndentStyle(entry.level)}>
                      {entry.label}
                    </span>
                  </a>
                )}
              </For>
            </nav>
          </Show>
        </aside>
      </div>
    </main>
  )
}
