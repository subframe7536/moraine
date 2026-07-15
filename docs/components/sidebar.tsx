import type { Accessor } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import { version } from '../../package.json'
import { Badge, Button, ListBox, cn } from '../../src'
import type { ListBoxT } from '../../src'

import type { DocsPageEntry } from './docs-route'

export type SidebarPage = DocsPageEntry

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
  setActivePage: (key: string) => void
}

export interface SidebarHeaderProps {
  isMobile?: boolean
  onClose?: () => void
}

interface SidebarSection {
  group?: string
  pages: SidebarPage[]
}

export const Sidebar = (props: SidebarProps) => {
  const grouped = createMemo<SidebarSection[]>(() => {
    const ungrouped: SidebarPage[] = []
    const groupedMap = new Map<string, SidebarPage[]>()

    for (const page of props.pages) {
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

  const items = createMemo<ListBoxT.Entry[]>(() => {
    const entries: ListBoxT.Entry[] = []

    for (const section of grouped()) {
      if (section.group) {
        entries.push({
          type: 'label',
          key: `group-${section.group}`,
          label: section.group,
        })
      }

      for (const page of section.pages) {
        entries.push({
          value: page.key,
          label: page.label,
          trailingRender: () => (
            <Show when={page.badge}>
              {(badge) => (
                <span class="text-[0.6rem] leading-none font-semibold px-1.25 py-0.75 border rounded-sm bg-background/70 shrink-0 uppercase">
                  {badge()}
                </span>
              )}
            </Show>
          ),
        })
      }
    }

    return entries
  })

  return (
    <div class="px-3 pb-10 pt-3 h-full min-h-0 overflow-y-auto">
      <nav class="pb-2 flex flex-col gap-5">
        <ListBox
          ariaLabel="Documentation pages"
          items={items()}
          selectionMode="single"
          value={props.activePage()}
          onChange={(value) => {
            if (typeof value === 'string' || typeof value === 'number') {
              props.setActivePage(String(value))
            }
          }}
          classes={{
            content: 'gap-0',
            label:
              'text-[0.68rem] text-muted-foreground tracking-[0.14em] font-semibold mb-1.5 mt-3 px-2 uppercase',
            item: 'text-sm text-muted-foreground px-2.5 py-1.75 min-h-0 rounded-md transition-([background-color,color] duration-150 ease-out) data-highlighted:(text-muted-foreground bg-transparent) data-selected:(text-accent-foreground font-medium bg-accent) hover:(text-foreground bg-accent/30)',
            itemWrapper: 'min-w-0',
            itemLabel: 'truncate',
          }}
        />

        <Show when={grouped().length === 0}>
          <p class="text-xs text-muted-foreground px-2 py-3">No results</p>
        </Show>

        <section>
          <div class="text-[0.68rem] text-muted-foreground tracking-[0.14em] font-semibold mb-1.5 mt-3 px-2 uppercase">
            Resources
          </div>
          <Button
            as="a"
            href="/llms.txt"
            rel="alternate external"
            type="text/markdown"
            variant="ghost"
            size="sm"
            leading="i-lucide-file-text"
            class="text-muted-foreground w-full justify-start hover:(text-foreground bg-accent/30)"
          >
            <span class="truncate">llms.txt</span>
          </Button>
        </section>
      </nav>
    </div>
  )
}

export const SidebarHeader = (props: SidebarHeaderProps) => {
  return (
    <div
      class={cn(
        'px-4 flex shrink-0 h-13 items-center justify-between',
        props.isMobile ? 'mt-1' : 'b-(b border)',
      )}
    >
      <div class="flex gap-2.5 min-w-0 items-center">
        <img src="/favicon.svg" alt="icon" class="size-7" />
        <p class="text-lg font-semibold truncate">
          Moraine
          <Badge size="xs" variant="outline" class="font-mono ms-1.5">
            v{version}
          </Badge>
        </p>
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
  )
}
