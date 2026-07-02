import type { Component } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, Button } from '../../src'
import type { ComponentAttributeDoc, ItemDoc, SlotDoc } from '../build/api-doc/types'
import type { FrontmatterData } from '../build/markdown/types'
import type { OnThisPageEntry } from '../hooks/use-table-of-contents'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference'
import { createDocsMdxComponents } from './mdx-components'
import { OnThisPage } from './on-this-page'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'
type DocsHeaderStatus = 'new' | 'update' | 'unreleased'

const DOCS_HEADER_STATUS_LABELS: Record<DocsHeaderStatus, string> = {
  new: 'NEW',
  update: 'UPDATE',
  unreleased: 'UNRELEASED',
}

const DOCS_HEADER_STATUS_ALIASES = new Map<string, DocsHeaderStatus>([
  ['new', 'new'],
  ['update', 'update'],
  ['unreleased', 'unreleased'],
  ['unrelease', 'unreleased'],
])

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
  slots: SlotDoc[]
  props: ComponentPropsDoc
  item?: ItemDoc
  attributes?: ComponentAttributeDoc
}

export interface DocsMdxCodeTabItem {
  label: string
  value: string
  html: string
}

export interface DocsMdxContentProps {
  components?: Record<string, unknown>
}

export interface RenderExampleMarkdownPageInput {
  apiDoc?: ExamplePageApiDoc
  frontmatter?: FrontmatterData
  onThisPageEntries?: OnThisPageEntry[]
  Content: Component<DocsMdxContentProps>
  codeTabs: Record<string, DocsMdxCodeTabItem[]>
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const components = createDocsMdxComponents(input)
  const component = () => input.apiDoc?.component
  const componentKey = () => input.frontmatter?.componentKey ?? component()?.key
  const pageTitle = () =>
    input.frontmatter?.name ?? component()?.name ?? input.frontmatter?.component
  const category = () => input.frontmatter?.category ?? component()?.category
  const description = () => input.frontmatter?.description ?? component()?.description
  const status = () =>
    DOCS_HEADER_STATUS_ALIASES.get(String(input.frontmatter?.status ?? '').toLowerCase())
  const githubSourceHref = () => {
    const sourcePath = component()?.sourcePath
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}` : undefined
  }
  const onThisPageEntries = createMemo(() => [
    ...(input.onThisPageEntries ?? []),
    ...getDocsApiReferenceTocEntries(input.apiDoc),
  ])

  return (
    <main class="text-foreground px-5 min-h-screen w-full sm:px-8">
      <div class="mx-auto flex gap-8 max-w-7xl items-start">
        <div class="mx-auto mb-24 max-w-4xl min-w-0 w-full">
          <Show when={input.frontmatter?.header && (component() || componentKey() || pageTitle())}>
            <header class="text-foreground mt-3">
              <div class="flex flex-wrap gap-2 items-center">
                <Show when={category()}>
                  {(nextCategory) => (
                    <span class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
                      {nextCategory()}
                    </span>
                  )}
                </Show>
                <Show when={componentKey()}>
                  {(nextComponentKey) => (
                    <span class="text-xs text-muted-foreground font-mono">
                      {nextComponentKey()}
                    </span>
                  )}
                </Show>
              </div>

              <Show when={pageTitle()}>
                {(title) => (
                  <div class="mt-3 flex flex-wrap gap-2.5 items-center">
                    <div class="text-2xl font-bold capitalize sm:text-3xl">{title()}</div>
                    <Show when={status()}>
                      {(nextStatus) => (
                        <Badge size="sm" variant="outline" class="tracking-wide font-semibold">
                          {DOCS_HEADER_STATUS_LABELS[nextStatus()]}
                        </Badge>
                      )}
                    </Show>
                  </div>
                )}
              </Show>

              <Show when={description()}>
                {(nextDescription) => (
                  <div class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base">
                    {nextDescription()}
                  </div>
                )}
              </Show>

              <Show when={githubSourceHref() || input.frontmatter?.upstreamHref}>
                <div class="text-xs mt-3 flex flex-wrap gap-3 items-center">
                  <Show when={githubSourceHref()}>
                    {(href) => (
                      <Button
                        as="a"
                        href={href()}
                        target="_blank"
                        rel="noreferrer"
                        variant="outline"
                        leading="i-lucide:github"
                      >
                        Source Code
                      </Button>
                    )}
                  </Show>

                  <Show when={input.frontmatter?.upstreamHref}>
                    {(href) => (
                      <Button
                        as="a"
                        href={href()}
                        target="_blank"
                        rel="noreferrer"
                        variant="outline"
                        leading="icon-external"
                      >
                        Upstream
                      </Button>
                    )}
                  </Show>
                </div>
              </Show>
            </header>
          </Show>
          <Dynamic component={input.Content} components={components} />
          <DocsApiReference apiDoc={input.apiDoc} />
        </div>
        <OnThisPage entries={onThisPageEntries()} />
      </div>
    </main>
  )
}
