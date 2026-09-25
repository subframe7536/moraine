import { Show, createSignal } from 'solid-js'

import { Button } from '../../../../src'
import type { ComponentApi } from '../../../build/api-doc/types'
import type { FrontmatterData } from '../../../build/markdown/types'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'

export interface DocsPageHeaderProps {
  pageKey: string
  apiDoc?: ComponentApi
  frontmatter: FrontmatterData
  markdownSource?: string
}

export function DocsPageHeader(props: DocsPageHeaderProps) {
  const component = () => props.apiDoc
  const componentKey = () => props.frontmatter.componentKey ?? component()?.key
  const category = () => props.frontmatter.category ?? props.frontmatter.api?.path.split('/')[1]
  const isPolymorphic = () =>
    component()?.parts.some((part) => part.props.some((prop) => prop.name === 'as')) ?? false
  const githubSourceHref = () => {
    const sourcePath = props.frontmatter.api?.path
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}.tsx` : undefined
  }
  const [copyState, setCopyState] = createSignal<'idle' | 'copied' | 'failed'>('idle')

  const copyMarkdownSource = async () => {
    const markdownSource = props.markdownSource
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

  return (
    <header class="text-foreground mt-3">
      <div class="flex flex-wrap gap-2 items-center">
        <Show when={category()}>
          {(nextCategory) => (
            <span class="text-muted-foreground tracking-[0.16em] font-semibold uppercase text-xs">
              {nextCategory()}
            </span>
          )}
        </Show>
        <Show when={componentKey()}>
          {(nextComponentKey) => (
            <span class="text-muted-foreground font-mono text-xs">{nextComponentKey()}</span>
          )}
        </Show>
        <Show when={component()?.kind}>
          {(kind) => (
            <a
              href="/styling/customization#component-kinds"
              aria-label={`${kind() === 'single' ? 'Single' : 'Composite'} component: styling guide`}
              class="text-muted-foreground px-2 py-0.5 border border-border bg-muted/40 transition-colors text-xs rounded-md hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
            >
              {kind() === 'single' ? 'Single' : 'Composite'}
            </a>
          )}
        </Show>
        <Show when={isPolymorphic()}>
          <a
            href="/typescript#polymorphic-rendering-as-prop"
            aria-label="Polymorphic: at least one component supports the as prop; see each component's Props"
            class="text-muted-foreground px-2 py-0.5 border border-border bg-muted/40 transition-colors text-xs rounded-md hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
          >
            Polymorphic
          </a>
        </Show>
      </div>

      <h1 class="font-bold mt-3 outline-none text-2xl sm:text-3xl" tabIndex={-1}>
        {props.frontmatter.title}
      </h1>

      <p class="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
        {props.frontmatter.description}
      </p>

      <div class="mt-4 flex flex-wrap gap-2 items-center text-xs">
        <Show when={props.markdownSource}>
          <Button
            as="a"
            href={`/${props.pageKey}.md`}
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
            disabled={!props.markdownSource}
            onClick={copyMarkdownSource}
            class="h-8 focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
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
