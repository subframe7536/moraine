import type { JSX } from '@solidjs/web'
import { createMemo } from 'solid-js'

import { getApiReferenceTocEntries } from '../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../build/api-doc/types'
import type { FrontmatterData } from '../../../build/markdown/types'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents'

import { DocsApiReference } from './api-reference'
import { ComponentDocContext } from './component-doc.context'
import { DocsPageHeader } from './docs-page-header'
import { DocsPageNavigation } from './navigation'
import { CompactOnThisPage, OnThisPage } from './toc'
export type ExamplePageApiDoc = ComponentApi

export interface DocsMdxCodeTabItem {
  label: string
  value: string
  html: string
}

export interface RenderExampleMarkdownPageInput {
  pageKey: string
  surface: string
  section: string
  routePath: string
  markdownPath: string
  apiDoc?: ExamplePageApiDoc
  frontmatter: FrontmatterData
  onThisPageEntries?: Array<OnThisPageEntry>
  children?: JSX.Element
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const onThisPageEntries = createMemo(() => [
    ...(input.onThisPageEntries ?? []),
    ...getApiReferenceTocEntries(input.apiDoc),
  ])

  return (
    <article class="text-foreground px-5 flex gap-8 min-h-screen w-full items-start sm:px-8">
      <div class="mx-auto flex-1 max-w-4xl min-w-0 w-full">
        <DocsPageHeader
          pageKey={input.pageKey}
          surface={input.surface}
          section={input.section}
          markdownPath={input.markdownPath}
          apiDoc={input.apiDoc}
          frontmatter={input.frontmatter}
        />

        <CompactOnThisPage entries={onThisPageEntries()} />

        <div class="mb-24 mt-8 min-w-0 w-full">
          <ComponentDocContext
            value={{
              name: input.apiDoc?.parts[0]?.name ?? input.frontmatter.title,
              api: input.apiDoc,
            }}
          >
            {input.children}
          </ComponentDocContext>
          <DocsApiReference apiDoc={input.apiDoc} />
          <DocsPageNavigation currentPagePath={input.routePath} />
        </div>
      </div>
      <OnThisPage
        class="overscroll-contain shrink-0 max-h-[calc(100dvh-100px)] w-60 hidden scrollbar-none overflow-y-auto xl:(block top-6 sticky)"
        entries={onThisPageEntries()}
      />
    </article>
  )
}
