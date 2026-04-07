import { Show } from 'solid-js'

import { Badge, Button } from '../../src'

import type { ExamplePageApiDoc } from './markdown'

const GITHUB_SOURCE_BASE_URL = 'https://github.com/subframe7536/moraine/blob/main'
type DocsHeaderStatus = 'new' | 'update' | 'unreleased'

const DOCS_HEADER_STATUS_LABELS: Record<DocsHeaderStatus, string> = {
  new: 'NEW',
  update: 'UPDATE',
  unreleased: 'UNRELEASED',
}

const DOCS_HEADER_STATUS_ALIASES = new Map<string, DocsHeaderStatus>([
  ['new', 'new'],
  ['update', 'update'],
  ['unreleased', 'unreleased'],
  ['unrelease', 'unreleased'],
])

interface DocsHeaderProps {
  componentKey?: string
  apiDoc?: ExamplePageApiDoc
  upstreamHref?: string
  name?: string
  category?: string
  description?: string
  status?: DocsHeaderStatus
}

export const DocsHeader = (props: DocsHeaderProps) => {
  const component = () => props.apiDoc?.component
  const pageTitle = () => props.name ?? props.componentKey
  const status = () => DOCS_HEADER_STATUS_ALIASES.get(String(props.status ?? '').toLowerCase())
  const githubSourceHref = () => {
    const sourcePath = component()?.sourcePath
    return sourcePath ? `${GITHUB_SOURCE_BASE_URL}/${sourcePath}` : undefined
  }

  return (
    <Show when={component() || props.componentKey}>
      <header class="text-foreground mt-8">
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
          <div class="mt-3 flex flex-wrap gap-2.5 items-center">
            <div class="text-2xl font-semibold capitalize sm:text-3xl">{pageTitle()}</div>
            <Show when={status()}>
              {(nextStatus) => (
                <Badge
                  size="sm"
                  variant="outline"
                  classes={{ root: 'tracking-wide font-semibold' }}
                >
                  {DOCS_HEADER_STATUS_LABELS[nextStatus()]}
                </Badge>
              )}
            </Show>
          </div>
        </Show>

        <Show when={component()?.description || props.description}>
          {(description) => (
            <div
              class="text-sm text-muted-foreground mt-2 max-w-3xl sm:text-base"
              // oxlint-disable-next-line subf/solid-no-innerhtml
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
