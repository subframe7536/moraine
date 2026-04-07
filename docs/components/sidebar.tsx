import type { Accessor } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import { version } from '../../package.json'
import { Badge, Button, cn, Input } from '../../src'

export interface SidebarPage {
  key: string
  label: string
  group?: string
}

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
  setActivePage: (key: string) => void
  search: Accessor<string>
}

export interface SidebarHeaderProps {
  search: Accessor<string>
  setSearch: (value: string) => void
  onClose?: () => void
}

interface SidebarSection {
  group?: string
  pages: SidebarPage[]
}

export const Sidebar = (props: SidebarProps) => {
  const filtered = createMemo(() => {
    const q = props.search().toLowerCase().trim()
    if (!q) {
      return props.pages
    }
    return props.pages.filter((p) => p.label.toLowerCase().includes(q))
  })

  const grouped = createMemo<SidebarSection[]>(() => {
    const ungrouped: SidebarPage[] = []
    const groupedMap = new Map<string, SidebarPage[]>()

    for (const page of filtered()) {
      const group = page.group?.trim()
      if (!group) {
        ungrouped.push(page)
        continue
      }

      const list = groupedMap.get(group) ?? []
      list.push(page)
      groupedMap.set(group, list)
    }

    return [
      ...(ungrouped.length > 0 ? [{ pages: ungrouped }] : []),
      ...[...groupedMap.entries()].map(([group, pages]) => ({ group, pages })),
    ]
  })

  return (
    <div class="text-foreground p-4 pb-10 pt-3 bg-muted/50 h-full min-h-0 overflow-y-auto">
      <nav class="pb-2 flex flex-col gap-4">
        <For each={grouped()}>
          {(section) => (
            <section>
              <Show when={section.group}>
                <div class="text-(sm muted-foreground) font-bold mb-1 mt-3 px-2">
                  {section.group}
                </div>
              </Show>

              <div class="flex flex-col gap-0.5">
                <For each={section.pages}>
                  {(page) => (
                    <button
                      type="button"
                      class={cn(
                        'text-sm text-muted-foreground px-2.5 py-1.5 text-left rounded-lg hover:cursor-pointer',
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
  )
}

export const SidebarHeader = (props: SidebarHeaderProps) => {
  return (
    <div class="text-foreground p-4 pb-3 border-b border-border bg-muted/50">
      <div class="px-2 flex items-center justify-between">
        <div class="text-foreground flex gap-2 items-center justify-between">
          <div class="flex gap-2 min-w-0 items-center">
            <img src="/favicon.svg" alt="icon" class="size-6" />
            <div class="min-w-0">
              <p class="text-lg font-semibold truncate">
                Moraine
                <Badge size="xs" classes={{ root: 'font-mono ms-1.5' }}>
                  v{version}
                </Badge>
              </p>
            </div>
          </div>
        </div>
        <Show when={props.onClose}>
          <Button
            variant="ghost"
            size="sm"
            leading="i-lucide-x"
            aria-label="Close sidebar"
            onClick={props.onClose}
          />
        </Show>
      </div>

      <div class="mt-4 px-1">
        <Input
          type="text"
          placeholder="Search component..."
          value={props.search()}
          onInput={(e) => props.setSearch(e.currentTarget.value)}
          leading="icon-search"
          classes={{ root: 'bg-background' }}
        />
      </div>
    </div>
  )
}
