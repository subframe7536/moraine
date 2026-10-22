import { Show } from 'solid-js'

import { Badge, Button, CopyButton } from '../../../../src'
import type { ComponentApi } from '../../../build/api-doc/types'
import type { FrontmatterData } from '../../../build/markdown/types'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'

export interface DocsPageHeaderProps {
  pageKey: string
  surface: string
  section: string
  markdownPath: string
  apiDoc?: ComponentApi
  frontmatter: FrontmatterData
}

export function DocsPageHeader(props: DocsPageHeaderProps) {
  const githubSourceHref = () => {
    const sourcePath = props.frontmatter.api?.path
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}.tsx` : undefined
  }

  async function fetchMarkdownSource(): Promise<string> {
    const response = await fetch(props.markdownPath)
    if (!response.ok) {
      throw new Error(`Markdown request failed: ${response.status}`)
    }
    return response.text()
  }

  return (
    <header class="text-foreground mt-4 md:mt-8">
      <h1 class="text-2xl font-bold mt-3 outline-none sm:text-3xl" tabIndex={-1}>
        {props.frontmatter.title}
      </h1>

      <p class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base">
        {props.frontmatter.description}
      </p>

      <Show
        when={
          props.surface === 'components' &&
          (props.apiDoc?.kind === 'composite' ||
            props.apiDoc?.parts[0]?.props.some((prop) => prop.name === 'as'))
        }
      >
        <div class="mt-3 flex flex-wrap gap-2 items-center">
          <Show when={props.apiDoc?.kind === 'composite'}>
            <Badge
              as="a"
              href="/docs/composition"
              variant="outline"
              size="sm"
              class={`transition-colors ${DOCS_FOCUS_RING_OFFSET_CLASS} hover:bg-accent`}
            >
              Composition
            </Badge>
          </Show>
          <Show when={props.apiDoc?.parts[0]?.props.some((prop) => prop.name === 'as')}>
            <Badge
              as="a"
              href="/docs/polymorphism"
              variant="outline"
              size="sm"
              class={`transition-colors ${DOCS_FOCUS_RING_OFFSET_CLASS} hover:bg-accent`}
            >
              Polymorphic
            </Badge>
          </Show>
        </div>
      </Show>

      <div class="text-xs mt-4 flex flex-wrap gap-2 items-center">
        <Button
          as="a"
          href={props.markdownPath}
          aria-label="View markdown source"
          rel="alternate external"
          type="text/markdown"
          variant="outline"
          size="sm"
          leading="i-lucide:file-text"
          class={`h-8 ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
        >
          View as Markdown
        </Button>
        <CopyButton
          value={fetchMarkdownSource}
          copiedDuration={1600}
          aria-label="Copy markdown source"
          variant="outline"
          size="sm"
          class={`h-8 ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
        >
          {(state) => (state.isCopied ? 'Copied Markdown' : 'Copy as Markdown')}
        </CopyButton>
        <Show when={githubSourceHref()}>
          {(href) => (
            <Button
              as="a"
              href={href()}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="sm"
              leading="i-lucide:github"
              class={`h-8 ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              Source Code
            </Button>
          )}
        </Show>

        <Show when={props.frontmatter.upstreamHref}>
          {(href) => (
            <Button
              as="a"
              href={href()}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="sm"
              leading="icon-external"
              class={`h-8 ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              Upstream
            </Button>
          )}
        </Show>
      </div>
    </header>
  )
}
