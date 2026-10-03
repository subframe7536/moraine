import { Show } from 'solid-js'

import { Badge, Button } from '../../../../src'
import type { ComponentApi } from '../../../build/api-doc/types'
import type { FrontmatterData } from '../../../build/markdown/types'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.class'
import { createClipboardCopy } from '../../hooks/create-clipboard-copy'

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
  const clipboard = createClipboardCopy({ resetAfter: 1600 })
  const copyMarkdownSource = () => {
    const markdownPath = props.markdownPath
    return clipboard.copy(async () => {
      const response = await fetch(markdownPath)
      if (!response.ok) {
        throw new Error(`Markdown request failed: ${response.status}`)
      }
      return response.text()
    })
  }

  return (
    <header class="text-foreground mt-4 md:mt-8">
      <h1 class="font-bold mt-3 outline-none text-2xl sm:text-3xl" tabIndex={-1}>
        {props.frontmatter.title}
      </h1>

      <p class="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
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

      <div class="mt-4 flex flex-wrap gap-2 items-center text-xs">
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
        <Button
          aria-label="Copy markdown source"
          variant="outline"
          size="sm"
          leading={clipboard.state() === 'copied' ? 'i-lucide:check' : 'i-lucide:copy'}
          onClick={copyMarkdownSource}
          class={`h-8 ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
        >
          {clipboard.state() === 'copied'
            ? 'Copied Markdown'
            : clipboard.state() === 'failed'
              ? 'Copy Failed'
              : 'Copy as Markdown'}
        </Button>
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
