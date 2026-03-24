import type { Accessor } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'

import { version } from '../../package.json'
import { Badge, cn, Input, Switch } from '../../src'

export interface SidebarPage {
  key: string
  label: string
  group: string
}

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
  setActivePage: (key: string) => void
  theme: Accessor<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => void
}

export const Sidebar = (props: SidebarProps) => {
  const [search, setSearch] = createSignal('')

  const filtered = createMemo(() => {
    const q = search().toLowerCase().trim()
    if (!q) {
      return props.pages
    }
    return props.pages.filter((p) => p.label.toLowerCase().includes(q))
  })

  const grouped = createMemo(() => {
    const map = new Map<string, SidebarPage[]>()

    for (const page of filtered()) {
      const list = map.get(page.group) ?? []
      list.push(page)
      map.set(page.group, list)
    }

    return [...map.entries()]
  })

  return (
    <aside class="text-foreground bg-muted/50 flex shrink-0 flex-col h-full w-full relative overflow-hidden">
      <div class="p-4 pb-3 border-b border-border">
        <div class="px-2 flex items-center justify-between">
          <div class="text-foreground flex gap-2 items-center justify-between">
            <div class="flex gap-2 min-w-0 items-center">
              <img src="/favicon.svg" alt="icon" class="size-6" />
              <div class="min-w-0">
                <p class="text-sm font-semibold truncate">
                  Rock UI
                  <Badge size="xs" classes={{ root: 'font-mono ms-1.5' }}>
                    v{version}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
          <Switch
            size="sm"
            checked={props.theme() === 'dark'}
            onChange={(next) => props.setTheme(next ? 'dark' : 'light')}
            checkedIcon="i-lucide-moon"
            uncheckedIcon="i-lucide-sun"
          />
        </div>

        <div class="mt-4 px-1">
          <Input
            type="text"
            placeholder="Search component..."
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            leading="icon-search"
            classes={{ root: 'bg-background' }}
          />
        </div>
      </div>

      <div class="p-4 pb-10 pt-3 flex-1 overflow-y-auto">
        <nav class="pb-2 flex flex-col gap-4">
          <For each={grouped()}>
            {([group, pages]) => (
              <section>
                <div class="text-(sm muted-foreground) font-bold mb-1 mt-3 px-2">{group}</div>

                <div class="flex flex-col gap-0.5">
                  <For each={pages}>
                    {(page) => (
                      <button
                        type="button"
                        class={cn(
                          'text-sm text-muted-foreground px-2.5 py-1.5 text-left rounded-lg',
                          props.activePage() === page.key
                            ? 'text-foreground bg-accent/80'
                            : 'hover:(text-muted-foreground bg-muted)',
                        )}
                        onClick={() => props.setActivePage(page.key)}
                      >
                        {page.label}
                      </button>
                    )}
                  </For>
                </div>
              </section>
            )}
          </For>

          <Show when={grouped().length === 0}>
            <p class="text-xs text-muted-foreground px-2">No results</p>
          </Show>
        </nav>
      </div>
    </aside>
  )
}
