import type { JSX } from 'solid-js'
import { createMemo, createSignal, onMount, Show, untrack } from 'solid-js'

import { Button } from '../../../../src/index.ts'
import type { ItemDoc, SlotDoc } from '../../../build/api-doc/types.ts'
import type { DocsRouteMetadata, FrontmatterData } from '../../../build/markdown/types.ts'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents.ts'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference.tsx'
import { DocsPageNavigation } from './docs-page-navigation.tsx'
import { OnThisPage } from './on-this-page.tsx'

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
}

export interface DocsMdxCodeTabItem {
  label: string
  value: string
  html: string
}

export interface RenderExampleMarkdownPageInput {
  pageKey: string
  apiDoc?: ExamplePageApiDoc
  frontmatter: FrontmatterData
  onThisPageEntries?: OnThisPageEntry[]
  markdownSource?: string
  metadata?: DocsRouteMetadata
  children?: JSX.Element
}

function updateMetaTag(attribute: 'name' | 'property', value: string, content: string): void {
  const meta = [...document.querySelectorAll<HTMLMetaElement>('meta')].find(
    (element) => element.getAttribute(attribute) === value,
  )
  if (meta) {
    meta.setAttribute('content', content)
    return
  }

  const nextMeta = document.createElement('meta')
  nextMeta.setAttribute(attribute, value)
  nextMeta.setAttribute('content', content)
  document.head.append(nextMeta)
}

function updateCanonical(href: string): void {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) {
    canonical.setAttribute('href', href)
    return
  }

  const nextCanonical = document.createElement('link')
  nextCanonical.setAttribute('rel', 'canonical')
  nextCanonical.setAttribute('href', href)
  document.head.append(nextCanonical)
}

export function useDocsPage(metadata?: DocsRouteMetadata): void {
  onMount(() => {
    if (!metadata) {
      return
    }

    document.title = metadata.title
    updateCanonical(metadata.canonical)
    updateMetaTag('name', 'description', metadata.description)
    for (const tag of metadata.meta) {
      const attribute = tag.name !== undefined ? 'name' : 'property'
      const value = tag.name ?? tag.property
      if (value !== undefined) {
        updateMetaTag(attribute, value, tag.content)
      }
    }
  })
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  useDocsPage(untrack(() => input.metadata))
  const component = () => input.apiDoc?.component
  const componentKey = () => input.frontmatter.componentKey ?? component()?.key
  const category = () => input.frontmatter.category ?? component()?.category
  const githubSourceHref = () => {
    const sourcePath = component()?.sourcePath
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}` : undefined
  }
  const [copyState, setCopyState] = createSignal<'idle' | 'copied' | 'failed'>('idle')

  const copyMarkdownSource = async () => {
    const markdownSource = input.markdownSource
    if (!markdownSource) {
      return
    }

    try {
      await navigator.clipboard.writeText(markdownSource)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1600)
    }
  }

  const onThisPageEntries = createMemo(() => [
    ...(input.onThisPageEntries ?? []),
    ...getDocsApiReferenceTocEntries(input.apiDoc),
  ])

  return (
    <article class="docs-content-gutter text-foreground min-h-screen w-full">
      <div class="mx-auto max-w-7xl">
        <header class="docs-article-measure text-foreground mt-3">
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

            <div class="text-xs mt-4 flex flex-wrap gap-2 items-center">
              <Show when={input.pageKey !== 'introduction' && input.markdownSource}>
                <Button
                  as="a"
                  href={`/${input.pageKey}.md`}
                  aria-label="View markdown source"
                  rel="alternate external"
                  type="text/markdown"
                  variant="outline"
                  leading="i-lucide:file-text"
                  class="docs-compact-control docs-focus-visible"
                >
                  View as Markdown
                </Button>
                <Button
                  aria-label="Copy markdown source"
                  variant="outline"
                  leading={copyState() === 'copied' ? 'i-lucide:check' : 'i-lucide:copy'}
                  disabled={!input.markdownSource}
                  onClick={copyMarkdownSource}
                  class="docs-compact-control docs-focus-visible"
                >
                  {copyState() === 'copied'
                    ? 'Copied Markdown'
                    : copyState() === 'failed'
                      ? 'Copy Failed'
                      : 'Copy as Markdown'}
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
                    class="docs-compact-control docs-focus-visible"
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
                    class="docs-compact-control docs-focus-visible"
                  >
                    Upstream
                  </Button>
                )}
              </Show>
            </div>
        </header>
        <div class="gap-8 grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
          <OnThisPage entries={onThisPageEntries()} />
          <div class="docs-article-measure docs-content-enter mb-24 min-w-0 w-full xl:col-start-1 xl:row-start-1">
            {input.children}
            <DocsApiReference apiDoc={input.apiDoc} />
            <DocsPageNavigation currentPageKey={input.pageKey} />
          </div>
        </div>
      </div>
    </article>
  )
}
