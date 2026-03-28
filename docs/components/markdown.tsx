import type { Component } from 'solid-js'
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'
import type { ItemsDoc } from '../vite-plugin/api-doc/types'
import { docsWidgetMap } from '../widgets'

import { ShikiCodeBlock } from './shiki-code-block'

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
  type: 'widget'
  widgetName: string
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

interface OnThisPageEntry {
  id: string
  label: string
  level: number
}

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

function decodeHashAnchor(hash: string): string {
  if (!hash) {
    return ''
  }
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const onThisPageEntries = () => input.onThisPageEntries ?? []
  const [activeOnThisPageId, setActiveOnThisPageId] = createSignal('')

  const scrollToAnchor = () => {
    const hash = decodeHashAnchor(location.hash.slice(1))
    if (!hash) {
      return true
    }

    const target = document.getElementById(hash)
    if (!target) {
      return false
    }
    target.scrollIntoView?.()
    return true
  }

  const syncActiveIdWithHash = () => {
    const hash = decodeHashAnchor(location.hash.slice(1))
    if (!hash) {
      setActiveOnThisPageId(onThisPageEntries()[0]?.id ?? '')
      return
    }

    setActiveOnThisPageId(hash)
  }

  onMount(() => {
    syncActiveIdWithHash()
    scrollToAnchor()

    const scrollRoot = document.querySelector<HTMLElement>('[data-docs-scroll-root="true"]')
    const observer =
      typeof IntersectionObserver === 'function' && onThisPageEntries().length > 0
        ? new IntersectionObserver(
            (entries) => {
              const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                  (left, right) => left.boundingClientRect.top - right.boundingClientRect.top,
                )[0]
              if (!visibleEntry?.target.id) {
                return
              }
              setActiveOnThisPageId(visibleEntry.target.id)
            },
            {
              root: scrollRoot,
              rootMargin: '0px',
              threshold: 0.98,
            },
          )
        : null

    if (observer) {
      for (const entry of onThisPageEntries()) {
        const target = document.getElementById(entry.id)
        if (target) {
          observer.observe(target)
        }
      }
    }

    const handleHashChange = () => {
      scrollToAnchor()
      syncActiveIdWithHash()
    }

    window.addEventListener('hashchange', handleHashChange)
    onCleanup(() => {
      window.removeEventListener('hashchange', handleHashChange)
      observer?.disconnect()
    })
  })

  const renderSegment = (segment: RenderSegment) => {
    switch (segment.type) {
      case 'markdown':
        return (
          <div
            class="max-w-none prose prose-neutral prose-headings:(text-foreground font-semibold mb-3 mt-8) prose-p:(text-muted-foreground leading-6) prose-pre:(b-1 b-border rounded-xl bg-muted) dark:prose-invert"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={segment.html}
          />
        )
      case 'example':
        return (
          <section class="b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden">
            <div class="p-6 flex items-center justify-center">
              <Dynamic component={segment.component} />
            </div>
            <Show when={segment.code}>
              <ShikiCodeBlock html={segment.code} class="border-t border-border bg-muted/70" />
            </Show>
          </section>
        )
      case 'widget': {
        const Widget = docsWidgetMap[segment.widgetName]

        return (
          <Show
            when={Widget}
            fallback={
              <div class="text-sm text-muted-foreground p-4 b-1 b-border rounded-xl border-dashed">
                Widget not found: {segment.widgetName}
              </div>
            }
          >
            {(w) => (
              <Dynamic
                component={w()}
                componentKey={input.componentKey}
                apiDoc={input.apiDoc}
                kobalteHref={input.kobalteHref}
                {...segment.props}
              />
            )}
          </Show>
        )
      }
      case 'code-tabs':
        return (
          <Tabs
            defaultValue={segment.items[0]?.value}
            variant="link"
            size="sm"
            classes={{
              list: 'w-fit',
              content: 'pt-1 [&_pre]:rounded-lg',
              trigger: 'flex-none',
            }}
            items={segment.items.map((item) => ({
              label: item.label,
              value: item.value,
              content: <ShikiCodeBlock variant="source" html={item.html} />,
            }))}
          />
        )
      default:
        return (
          <div class="text-sm text-muted-foreground p-4 b-1 b-border rounded-xl border-dashed">
            Unsupported segment type
          </div>
        )
    }
  }

  return (
    <main class="text-foreground px-4 py-8 min-h-screen w-full sm:(px-8 py-16)">
      <div class="mx-auto flex gap-8 max-w-7xl items-start">
        <div class="flex-1 min-w-0">
          <div class="mx-auto flex flex-col gap-4 max-w-4xl">
            <For each={input.segments}>{renderSegment}</For>
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
                    aria-current={activeOnThisPageId() === entry.id ? 'location' : undefined}
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
