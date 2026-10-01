import { For, Show, createSignal } from 'solid-js'

import { Collapsible, Icon } from '../../../../../src'
import type { OnThisPageEntry } from '../../../hooks/use-table-of-contents'
import { DOCS_INLINE_CODE_CLASS } from '../markdown.class'

export function CompactOnThisPage(props: { entries: OnThisPageEntry[] }) {
  const [open, setOpen] = createSignal(false)

  return (
    <Show when={props.entries.length > 0}>
      <Collapsible
        open={open()}
        onOpenChange={setOpen}
        transition
        class="mt-6 border-y border-border/60 xl:hidden"
      >
        <Collapsible.Trigger class="text-muted-foreground px-3 py-2 flex w-full transition items-center justify-between rounded-md hover:(text-foreground bg-muted) focus-visible:(outline-none ring-2 ring-ring)">
          On This Page
          <Icon name="i-lucide:chevron-down" class={open() ? 'size-4 rotate-180' : 'size-4'} />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <nav aria-label="On This Page" class="pb-2 flex flex-col">
            <For each={props.entries}>
              {(entry) => (
                <a
                  href={`#${encodeURIComponent(entry.id)}`}
                  target="_self"
                  data-toc-id={entry.id}
                  class="text-muted-foreground px-2 py-2 flex min-h-11 items-center text-sm rounded-md hover:(text-foreground bg-muted/60) focus-visible:(outline-none ring-2 ring-ring)"
                  style={{
                    'padding-inline-start': `${0.5 + Math.max(0, entry.level - 1) * 0.75}rem`,
                  }}
                  onClick={(event) => {
                    if (
                      event.button === 0 &&
                      !event.metaKey &&
                      !event.ctrlKey &&
                      !event.shiftKey &&
                      !event.altKey
                    ) {
                      setOpen(false)
                    }
                  }}
                >
                  <Show
                    when={entry.label.startsWith('`') && entry.label.endsWith('`')}
                    fallback={entry.label}
                  >
                    <code class={DOCS_INLINE_CODE_CLASS}>{entry.label.slice(1, -1)}</code>
                  </Show>
                </a>
              )}
            </For>
          </nav>
        </Collapsible.Content>
      </Collapsible>
    </Show>
  )
}
