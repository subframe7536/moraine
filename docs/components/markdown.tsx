import type { Component } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Button } from '../../src'
import type { ComponentAttributeDoc, ItemDoc, SlotDoc } from '../build/api-doc/types'
import type { FrontmatterData } from '../build/markdown/types'
import type { OnThisPageEntry } from '../hooks/use-table-of-contents'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference'
import { DocsPageNavigation } from './docs-page-navigation'
import { createDocsMdxComponents } from './mdx-components'
import { OnThisPage } from './on-this-page'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'

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

export interface DocsMdxExample {
  component: Component
  source?: string
}

export interface RenderExampleMarkdownPageInput {
  pageKey: string
  apiDoc?: ExamplePageApiDoc
  frontmatter: FrontmatterData
  onThisPageEntries?: OnThisPageEntry[]
  Content: Component<DocsMdxContentProps>
  examples: Record<string, DocsMdxExample>
  codeTabs: Record<string, DocsMdxCodeTabItem[]>
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const components = createDocsMdxComponents(input)
  const component = () => input.apiDoc?.component
  const componentKey = () => input.frontmatter.componentKey ?? component()?.key
  const category = () => input.frontmatter.category ?? component()?.category
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
                  <span class="text-xs text-muted-foreground font-mono">{nextComponentKey()}</span>
                )}
              </Show>
            </div>

            <h1 class="text-2xl font-bold mt-3 sm:text-3xl">{input.frontmatter.title}</h1>

            <p class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base">
              {input.frontmatter.description}
            </p>

            <div class="text-xs mt-3 flex flex-wrap gap-3 items-center">
              <Show when={input.pageKey !== 'introduction'}>
                <Button
                  as="a"
                  href={`/${input.pageKey}.md`}
                  aria-label="View markdown source"
                  rel="alternate external"
                  type="text/markdown"
                  variant="outline"
                  size="sm"
                  leading="i-lucide:file-text"
                >
                  View as Markdown
                </Button>
              </Show>
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

              <Show when={input.frontmatter.upstreamHref}>
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
          </header>
          <Dynamic component={input.Content} components={components} />
          <DocsApiReference apiDoc={input.apiDoc} />
          <DocsPageNavigation currentPageKey={input.pageKey} />
        </div>
        <OnThisPage entries={onThisPageEntries()} />
      </div>
    </main>
  )
}
