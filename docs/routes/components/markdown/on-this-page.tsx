import { useLocation, useNavigate } from '@solidjs/router'
import { For, Show } from 'solid-js'

import { useTableOfContents } from '../../hooks/use-table-of-contents'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents'

function getOnThisPageIndentStyle(level: number) {
  const indentLevel = Math.max(0, level - 1)
  return { 'padding-inline-start': `${indentLevel * 0.75}rem` }
}

function getLocationHash(routerHash: string): string {
  return routerHash || (typeof window === 'undefined' ? '' : window.location.hash)
}

export function OnThisPage(props: { entries: OnThisPageEntry[]; class?: string }) {
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
    <nav aria-label="On This Page" class={props.class}>
      <p class="text-[0.68rem] text-muted-foreground/80 tracking-[0.14em] font-semibold uppercase">
        On This Page
      </p>
      <Show
        when={props.entries.length > 0}
        fallback={<p class="text-xs text-muted-foreground mt-3">No sections</p>}
      >
        <div class="mt-2.5 flex flex-col gap-0.5">
          <For each={props.entries}>
            {(entry) => (
              <a
                href={`#${entry.id}`}
                onClick={handleAnchorClick}
                aria-current={primaryActiveId() === entry.id ? 'location' : undefined}
                data-active={activeIds().includes(entry.id) ? '' : undefined}
                class="text-xs text-muted-foreground leading-7 px-2 py-0.5 transition-colors data-active:(text-primary font-medium) hover:text-foreground focus-visible:effect-fv"
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
