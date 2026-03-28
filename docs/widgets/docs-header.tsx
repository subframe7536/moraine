import { Show } from 'solid-js'

import { Button } from '../../src'
import type { ExamplePageApiDoc } from '../components/markdown'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'

interface DocsHeaderWidgetProps {
  componentKey?: string
  apiDoc?: ExamplePageApiDoc
  kobalteHref?: string
}

export const DocsHeaderWidget = (props: DocsHeaderWidgetProps) => {
  const component = () => props.apiDoc?.component
  const pageTitle = () => component()?.name ?? props.componentKey
  const githubSourceHref = () => {
    const sourcePath = component()?.sourcePath
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}` : undefined
  }

  return (
    <Show when={component() || props.componentKey}>
      <header class="text-foreground">
        <div class="flex flex-wrap gap-2 items-center">
          <Show when={component()?.category}>
            <p class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
              {component()!.category}
            </p>
          </Show>
          <Show when={props.componentKey}>
            <p class="text-xs text-muted-foreground font-mono">{props.componentKey}</p>
          </Show>
          <Show when={component()?.polymorphic}>
            <span class="text-xs text-muted-foreground">•</span>
          </Show>
          <Show when={component()?.polymorphic}>
            <p class="text-xs text-muted-foreground font-medium">Polymorphic</p>
          </Show>
        </div>

        <Show when={pageTitle()}>
          <p class="text-2xl font-semibold mt-3 sm:text-3xl">{pageTitle()}</p>
        </Show>

        <Show when={component()?.description}>
          <p class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base">
            {component()!.description}
          </p>
        </Show>

        <Show when={githubSourceHref() || props.kobalteHref}>
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
                  GitHub Source
                </Button>
              )}
            </Show>

            <Show when={props.kobalteHref}>
              {(href) => (
                <Button
                  as="a"
                  href={href()}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  leading="icon-external"
                >
                  Kobalte
                </Button>
              )}
            </Show>
          </div>
        </Show>
      </header>
    </Show>
  )
}
