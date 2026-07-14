import { Show, createMemo } from 'solid-js'

import { cn } from '../../src'

import { getAdjacentDocsPages } from './docs-page-navigation.utils'
import { getDocsPages } from './docs-route'
import type { DocsPageEntry } from './docs-route'

function NavigationCard(props: {
  direction: 'previous' | 'next'
  page: DocsPageEntry
  class?: string
}) {
  const isNext = () => props.direction === 'next'

  return (
    <a
      href={props.page.path}
      aria-label={`${isNext() ? 'Next' : 'Previous'} page: ${props.page.label}`}
      class={cn(
        'group px-4 py-3.5 border border-border rounded-lg bg-background flex gap-3 min-h-20 w-full transition-([background-color,border-color,transform] duration-180 ease-out) items-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:(border-primary/40 bg-accent/35) active:translate-y-px',
        isNext() ? 'text-right justify-end' : 'text-left',
        props.class,
      )}
    >
      <Show when={!isNext()}>
        <span
          class="i-lucide-arrow-left text-muted-foreground shrink-0 size-4 transition-transform duration-180 ease-out group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
      </Show>
      <span class="min-w-0">
        <span class="text-xs text-muted-foreground block">{isNext() ? 'Next' : 'Previous'}</span>
        <span class="text-sm text-foreground font-medium mt-1 block truncate">
          {props.page.label}
        </span>
      </span>
      <Show when={isNext()}>
        <span
          class="i-lucide-arrow-right text-muted-foreground shrink-0 size-4 transition-transform duration-180 ease-out group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Show>
    </a>
  )
}

export function DocsPageNavigation(props: { currentPageKey: string }) {
  const pages = getDocsPages()
  const adjacent = createMemo(() => getAdjacentDocsPages(pages, props.currentPageKey))

  return (
    <nav
      aria-label="Documentation pagination"
      class="mt-12 pt-6 border-t border-border/80 gap-3 grid sm:grid-cols-2"
    >
      <Show when={adjacent().previous}>
        {(page) => <NavigationCard direction="previous" page={page()} />}
      </Show>
      <Show when={adjacent().next}>
        {(page) => (
          <NavigationCard
            direction="next"
            page={page()}
            class={adjacent().previous ? undefined : 'sm:col-start-2'}
          />
        )}
      </Show>
    </nav>
  )
}
