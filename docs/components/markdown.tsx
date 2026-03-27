import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, Tabs } from '../../src'
import type { ItemsDoc } from '../vite-plugin/api-doc'
import { docsWidgetMap } from '../widgets'

import { PropsTable } from './props-table'
import type { ComponentPropsDoc } from './props-table'
import { ShikiCodeBlock } from './shiki-code-block'

interface ComponentIndexEntry {
  name: string
  key: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
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

export interface RenderExampleMarkdownPageInput {
  componentKey?: string
  apiDoc?: ExamplePageApiDoc
  extraApiDocs?: ExamplePageApiDoc[]
  segments: RenderSegment[]
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const component = () => input.apiDoc?.component
  const propsDoc = () => input.apiDoc?.props ?? { own: [], inherited: [] }
  const itemsDoc = () => input.apiDoc?.items
  const slots = () => input.apiDoc?.slots ?? []
  const extraApiDocs = () => input.extraApiDocs ?? []

  const hasProps = (data: ComponentPropsDoc, items?: ItemsDoc) => {
    return data.own.length > 0 || data.inherited.length > 0 || Boolean(items)
  }

  const shouldShowHeader = () => Boolean(component() || input.componentKey)

  const renderSegment = (segment: RenderSegment) => {
    switch (segment.type) {
      case 'markdown':
        return (
          <div
            class="max-w-none prose prose-slate prose-headings:(text-foreground font-semibold mb-3 mt-8) prose-p:(text-muted-foreground leading-7) prose-pre:(border border-border rounded-xl bg-muted) dark:(prose-invert)"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={segment.html}
          />
        )
      case 'example':
        return (
          <section class="border border-border rounded-2xl bg-background shadow-sm overflow-hidden">
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
              <div class="text-sm text-muted-foreground p-4 border border-border rounded-xl border-dashed">
                Widget not found: {segment.widgetName}
              </div>
            }
          >
            {(w) => <Dynamic component={w()} {...segment.props} />}
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
          <div class="text-sm text-muted-foreground p-4 border border-border rounded-xl border-dashed">
            Unsupported segment type
          </div>
        )
    }
  }

  return (
    <main class="text-foreground p-4 min-h-screen w-full sm:p-8">
      <div class="mx-auto flex flex-col gap-4 max-w-4xl">
        <Show when={shouldShowHeader()}>
          <header class="text-foreground">
            <div class="flex flex-wrap gap-2 items-center">
              <Show when={component()?.category}>
                <p class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
                  {component()!.category}
                </p>
              </Show>
              <Show when={input.componentKey}>
                <p class="text-xs text-muted-foreground font-mono">{input.componentKey}</p>
              </Show>
              <Show when={component()?.polymorphic}>
                <span class="text-xs text-muted-foreground">•</span>
              </Show>
              <Show when={component()?.polymorphic}>
                <p class="text-xs text-muted-foreground font-medium">Polymorphic</p>
              </Show>
            </div>
            <Show when={component()?.name ?? input.componentKey}>
              <h1 class="text-2xl font-semibold mt-3 sm:text-3xl">
                {component()?.name ?? input.componentKey}
              </h1>
            </Show>
            <Show when={component()?.description}>
              <p class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base">
                {component()!.description}
              </p>
            </Show>
            <Show when={component()?.sourcePath}>
              <p class="text-xs text-muted-foreground font-mono mt-3">{component()!.sourcePath}</p>
            </Show>
          </header>
        </Show>

        <For each={input.segments}>{renderSegment}</For>

        <Show when={slots().length > 0}>
          <section>
            <h2 class="text-xs text-muted-foreground tracking-[0.16em] font-semibold mb-4 uppercase">
              Slots
            </h2>
            <div class="flex flex-wrap gap-2">
              <For each={slots()}>{(slot) => <Badge>{slot}</Badge>}</For>
            </div>
          </section>
        </Show>

        <Show when={hasProps(propsDoc(), itemsDoc())}>
          <section>
            <h2 class="text-xs text-muted-foreground tracking-[0.16em] font-semibold mb-4 uppercase">
              Props
            </h2>
            <PropsTable props={propsDoc()} items={itemsDoc()} />
          </section>
        </Show>

        <For each={extraApiDocs()}>
          {(doc) => (
            <>
              <section>
                <div class="mb-4 flex flex-wrap gap-2 items-center">
                  <h2 class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
                    {doc.component.name} API
                  </h2>
                  <p class="text-xs text-muted-foreground font-mono">{doc.component.key}</p>
                </div>
                <Show when={doc.component.description}>
                  <p class="text-sm text-muted-foreground max-w-3xl">{doc.component.description}</p>
                </Show>
                <Show when={doc.component.sourcePath}>
                  <p class="text-xs text-muted-foreground font-mono mt-2">
                    {doc.component.sourcePath}
                  </p>
                </Show>
              </section>

              <Show when={doc.slots.length > 0}>
                <section>
                  <h2 class="text-xs text-muted-foreground tracking-[0.16em] font-semibold mb-4 uppercase">
                    {doc.component.name} Slots
                  </h2>
                  <div class="flex flex-wrap gap-2">
                    <For each={doc.slots}>{(slot) => <Badge>{slot}</Badge>}</For>
                  </div>
                </section>
              </Show>

              <Show when={hasProps(doc.props, doc.items)}>
                <section>
                  <h2 class="text-xs text-muted-foreground tracking-[0.16em] font-semibold mb-4 uppercase">
                    {doc.component.name} Props
                  </h2>
                  <PropsTable props={doc.props} items={doc.items} />
                </section>
              </Show>
            </>
          )}
        </For>
      </div>
    </main>
  )
}
