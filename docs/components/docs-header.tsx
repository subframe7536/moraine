import { Show } from 'solid-js'

import { Button } from '../../src'

import type { ExamplePageApiDoc } from './markdown'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'

interface DocsHeaderProps {
  componentKey?: string
  apiDoc?: ExamplePageApiDoc
  upstreamHref?: string
  name?: string
  category?: string
  description?: string
}

export const DocsHeader = (props: DocsHeaderProps) => {
  const component = () => props.apiDoc?.component
  const pageTitle = () => props.name ?? props.componentKey
  const githubSourceHref = () => {
    const sourcePath = component()?.sourcePath
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}` : undefined
  }

  return (
    <Show when={component() || props.componentKey}>
      <header class="text-foreground">
        <div class="flex flex-wrap gap-2 items-center">
          <Show when={component()?.category || props.category}>
            <span class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
              {component()?.category || props.category}
            </span>
          </Show>
          <Show when={props.componentKey}>
            <span class="text-xs text-muted-foreground font-mono">{props.componentKey}</span>
          </Show>
        </div>

        <Show when={pageTitle()}>
          <h1 class="text-2xl font-semibold mt-3 capitalize sm:text-3xl">{pageTitle()}</h1>
        </Show>

        <Show when={component()?.description || props.description}>
          {(description) => (
            <div
              class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base"
              // oxlint-disable-next-line solid/no-innerhtml
              innerHTML={description()}
            />
          )}
        </Show>

        <Show when={githubSourceHref() || props.upstreamHref}>
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

            <Show when={props.upstreamHref}>
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
  )
}
