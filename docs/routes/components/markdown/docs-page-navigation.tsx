import { Show, createMemo } from 'solid-js'

import { Button, cn } from '../../../../src'
import { getDocsPages } from '../../docs-route'
import type { DocsPageEntry } from '../../docs-route'

import { getAdjacentDocsPages } from './docs-page-navigation.utils'

function DocsPageNavigationCard(props: {
  direction: 'previous' | 'next'
  page: DocsPageEntry
  class?: string
}) {
  const isNext = () => props.direction === 'next'

  return (
    <Button
      as="a"
      href={props.page.path}
      aria-label={`${isNext() ? 'Next' : 'Previous'} page: ${props.page.label}`}
      variant="outline"
      leading={isNext() ? undefined : 'i-lucide-arrow-left'}
      trailing={isNext() ? 'i-lucide-arrow-right' : undefined}
      classes={{
        label: isNext() ? 'text-right' : 'text-left',
        leading:
          'text-muted-foreground shrink-0 size-4 transition-transform duration-180 ease-out group-hover:-translate-x-0.5',
        trailing:
          'text-muted-foreground shrink-0 size-4 transition-transform duration-180 ease-out group-hover:translate-x-0.5',
      }}
      class={cn(
        'group px-4 py-3.5 rounded-lg bg-background gap-3 h-auto min-h-20 w-full transition-([background-color,border-color,transform] duration-180 ease-out) hover:(border-primary/40 bg-accent/35) active:translate-y-px',
        isNext() ? 'justify-end' : 'justify-start',
        props.class,
      )}
    >
      <span class="min-w-0">
        <span class="text-xs text-muted-foreground block">{isNext() ? 'Next' : 'Previous'}</span>
        <span class="text-sm text-foreground font-medium mt-1 block truncate">
          {props.page.label}
        </span>
      </span>
    </Button>
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
        {(page) => <DocsPageNavigationCard direction="previous" page={page()} />}
      </Show>
      <Show when={adjacent().next}>
        {(page) => (
          <DocsPageNavigationCard
            direction="next"
            page={page()}
            class={adjacent().previous ? undefined : 'sm:col-start-2'}
          />
        )}
      </Show>
    </nav>
  )
}
