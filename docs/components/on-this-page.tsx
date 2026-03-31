import { For, Show } from 'solid-js'

import { useTableOfContents } from '../hooks/use-table-of-contents'
import type { OnThisPageEntry } from '../hooks/use-table-of-contents'

function getOnThisPageIndentStyle(level: number) {
  const indentLevel = Math.max(0, level - 1)
  return { 'padding-inline-start': `${indentLevel * 0.75}rem` }
}

export function OnThisPage(props: { entries: OnThisPageEntry[] }) {
  const { activeId } = useTableOfContents(() => props.entries)

  return (
    <aside class="p-4 shrink-0 max-h-[calc(100vh-4rem)] w-60 hidden self-start top-8 sticky overflow-y-auto xl:block">
      <p class="text-xs text-muted-foreground tracking-[0.16em] font-semibold uppercase">
        On This Page
      </p>
      <Show
        when={props.entries.length > 0}
        fallback={<p class="text-xs text-muted-foreground mt-3">No sections</p>}
      >
        <nav aria-label="On This Page" class="mt-3 flex flex-col gap-1">
          <For each={props.entries}>
            {(entry) => (
              <a
                href={`#${entry.id}`}
                aria-current={activeId() === entry.id ? 'location' : undefined}
                class="text-sm text-muted-foreground leading-8 px-2 b-(1 transparent) rounded-md h-8 aria-current:(text-foreground b-border bg-accent/60) hover:text-foreground"
              >
                <span class="block truncate" style={getOnThisPageIndentStyle(entry.level)}>
                  {entry.label}
                </span>
              </a>
            )}
          </For>
        </nav>
      </Show>
    </aside>
  )
}
