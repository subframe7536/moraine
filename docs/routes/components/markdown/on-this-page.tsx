import { useLocation, useNavigate } from '@solidjs/router'
import { For, Show } from 'solid-js'

import { useTableOfContents } from '../../hooks/use-table-of-contents.ts'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents.ts'

function getOnThisPageIndentStyle(level: number) {
  const indentLevel = Math.max(0, level - 1)
  return { 'padding-inline-start': `${indentLevel * 0.75}rem` }
}

function getLocationHash(routerHash: string): string {
  return routerHash || (typeof window === 'undefined' ? '' : window.location.hash)
}

export function OnThisPage(props: { entries: OnThisPageEntry[] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeIds, primaryActiveId } = useTableOfContents(
    () => props.entries,
    () => getLocationHash(location.hash),
    () => document.querySelector<HTMLElement>('[data-slot="main"]') ?? undefined,
  )

  const handleAnchorClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    const anchor = event.currentTarget as HTMLAnchorElement
    navigate(anchor.getAttribute('href') ?? '#', { scroll: false })
  }

  return (
    <nav
      aria-label="On This Page"
      class="bg-muted/35 border-border/80 my-6 p-4 rounded-lg xl:(docs-toc-width bg-transparent border-0 my-0 p-0 max-h-[calc(100vh-4rem)] self-start top-13 sticky overflow-y-auto col-start-2 row-start-1)"
    >
      <p class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
        On This Page
      </p>
      <Show
        when={props.entries.length > 0}
        fallback={<p class="text-xs text-muted-foreground mt-3">No sections</p>}
      >
        <div class="mt-3 flex flex-col gap-1">
          <For each={props.entries}>
            {(entry) => (
              <a
                href={`#${entry.id}`}
                onClick={handleAnchorClick}
                aria-current={primaryActiveId() === entry.id ? 'location' : undefined}
                data-active={activeIds().includes(entry.id) ? '' : undefined}
                class="docs-focus-visible text-(sm muted-foreground) leading-8 px-2 b-(1 border transparent) rounded-md h-8 data-active:(border-primary/20 bg-accent/35 text-primary) hover:text-foreground"
              >
                <span class="block truncate" style={getOnThisPageIndentStyle(entry.level)}>
                  <Show
                    when={entry.label.startsWith('`') && entry.label.endsWith('`')}
                    fallback={entry.label}
                  >
                    <code class="docs-inline-code">{entry.label.slice(1, -1)}</code>
                  </Show>
                </span>
              </a>
            )}
          </For>
        </div>
      </Show>
    </nav>
  )
}
