import type { JSX } from '@solidjs/web'
import { useRouteInfo } from 'solid-file-router'

import type { ComponentApi } from '../../../build/api-doc/types'

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
  routePath: string
  apiDoc?: ExamplePageApiDoc
  sourcePath?: string
  upstreamHref?: string
  children?: JSX.Element
}

export function Markdown(input: RenderExampleMarkdownPageInput) {
  const routeInfo = useRouteInfo()
  // Index routes in solid-file-router's routeInfo carry a trailing slash (e.g. `/components/accordion/`).
  const info = () =>
    routeInfo[input.routePath] ??
    (input.routePath === '/' ? undefined : routeInfo[`${input.routePath}/`])
  const onThisPageEntries = () => info()?.sections ?? []

  return (
    <article class="text-foreground px-5 flex gap-8 min-h-screen w-full items-start sm:px-8">
      <div class="mx-auto flex-1 max-w-4xl min-w-0 w-full">
        <DocsPageHeader
          title={info()?.title ?? ''}
          description={info()?.description ?? ''}
          surface={info()?.surface ?? 'docs'}
          markdownPath={info()?.markdownPath ?? ''}
          apiDoc={input.apiDoc}
          sourcePath={input.sourcePath}
          upstreamHref={input.upstreamHref}
        />

        <CompactOnThisPage entries={onThisPageEntries()} />

        <div class="mb-24 mt-8 min-w-0 w-full">
          <ComponentDocContext
            value={{
              name: input.apiDoc?.parts[0]?.name ?? info()?.title ?? '',
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
