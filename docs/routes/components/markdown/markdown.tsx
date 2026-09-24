import type { JSX } from 'solid-js'
import { createMemo, onMount, untrack } from 'solid-js'

import type { ComponentApi } from '../../../build/api-doc/types'
import type { DocsRouteMetadata, FrontmatterData } from '../../../build/markdown/types'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './api-reference'
import { DocsPageHeader } from './docs-page-header'
import { DocsPageNavigation } from './navigation'
import { DocsPlaygroundApiContext } from './playground'
import { OnThisPage } from './toc'

export { DocsPageHeader, type DocsPageHeaderProps } from './docs-page-header'

export type ExamplePageApiDoc = ComponentApi

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

  const onThisPageEntries = createMemo(() => [
    ...(input.onThisPageEntries ?? []),
    ...getDocsApiReferenceTocEntries(input.apiDoc),
  ])

  return (
    <article class="text-foreground px-5 flex gap-8 min-h-screen w-full items-start sm:px-8 lg:gap-12">
      <div class="mx-auto flex-1 max-w-4xl min-w-0 w-full">
        <DocsPageHeader
          pageKey={input.pageKey}
          apiDoc={input.apiDoc}
          frontmatter={input.frontmatter}
          markdownSource={input.markdownSource}
        />

        <div class="mb-24 min-w-0 w-full">
          <DocsPlaygroundApiContext.Provider value={input.apiDoc}>
            {input.children}
          </DocsPlaygroundApiContext.Provider>
          <DocsApiReference apiDoc={input.apiDoc} />
          <DocsPageNavigation currentPageKey={input.pageKey} />
        </div>
      </div>
      <OnThisPage
        class="shrink-0 h-fit w-60 hidden lg:(block top-20 sticky)"
        entries={onThisPageEntries()}
      />
    </article>
  )
}
