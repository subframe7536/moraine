import { Show, createSignal } from 'solid-js'

import { Button } from '../../../../src'
import type { ComponentApi } from '../../../build/api-doc/types'
import type { FrontmatterData } from '../../../build/markdown/types'

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
  const [copyState, setCopyState] = createSignal<'idle' | 'copied' | 'failed'>('idle')

  const copyMarkdownSource = async () => {
    try {
      const response = await fetch(props.markdownPath)
      if (!response.ok) {
        throw new Error(`Markdown request failed: ${response.status}`)
      }
      await navigator.clipboard.writeText(await response.text())
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1600)
    }
  }

  return (
    <header class="text-foreground mt-4 md:mt-8">
      <h1 class="font-bold mt-3 outline-none text-2xl sm:text-3xl" tabIndex={-1}>
        {props.frontmatter.title}
      </h1>

      <p class="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
        {props.frontmatter.description}
      </p>

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
          class="h-8 focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
        >
          View as Markdown
        </Button>
        <Button
          aria-label="Copy markdown source"
          variant="outline"
          size="sm"
          leading={copyState() === 'copied' ? 'i-lucide:check' : 'i-lucide:copy'}
          onClick={copyMarkdownSource}
          class="h-8 focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
        >
          {copyState() === 'copied'
            ? 'Copied Markdown'
            : copyState() === 'failed'
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
              class="h-8 focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
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
              class="h-8 focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
            >
              Upstream
            </Button>
          )}
        </Show>
      </div>
    </header>
  )
}
