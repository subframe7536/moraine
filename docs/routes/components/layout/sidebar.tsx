import type { Accessor } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, cn, List } from '../../../../src/index.ts'
import type { DocsPageEntry } from '../../docs-route.ts'

const { version } = packageMetadata

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

  return (
    <div class="px-3 pb-10 pt-3 h-full min-h-0 overflow-y-auto">
      <nav class="pb-2 flex flex-col gap-5">
        <For each={grouped()}>
          {(section) => (
            <section>
              <Show when={section.group}>
                <div class="text-[0.68rem] text-muted-foreground tracking-[0.14em] font-semibold mb-1.5 mt-3 px-2 uppercase">
                  {section.group}
                </div>
              </Show>

              <List<SidebarPage, 'div'>
                as="div"
                class="flex flex-col gap-0.5"
                items={section.pages}
                itemRender={(context) => (
                  <button
                    type="button"
                    class={cn(
                      'text-sm text-muted-foreground px-2.5 py-1.75 text-left rounded-md transition-([background-color,color] duration-150 ease-out) hover:cursor-pointer',
                      props.activePage() === context.item.key
                        ? 'text-accent-foreground font-medium bg-accent'
                        : 'hover:text-foreground hover:bg-accent/30',
                    )}
                    onClick={() => props.setActivePage(context.item.key)}
                  >
                    <span class="flex gap-2 min-w-0 w-full items-center justify-between">
                      <span class="truncate">{context.item.label}</span>
                      <Show when={context.item.badge}>
                        {(badge) => <Badge variant="outline">{badge()}</Badge>}
                      </Show>
                    </span>
                  </button>
                )}
              />
            </section>
          )}
        </For>

        <Show when={grouped().length === 0}>
          <p class="text-xs text-muted-foreground px-2 py-3">No results</p>
        </Show>

        <section>
          <div class="text-[0.68rem] text-muted-foreground tracking-[0.14em] font-semibold mb-1.5 mt-3 px-2 uppercase">
            Resources
          </div>
          <a
            href="/llms.txt"
            rel="alternate external"
            type="text/markdown"
            class="text-sm text-muted-foreground px-2.5 py-1.75 rounded-md flex gap-2 transition-([background-color,color] duration-150 ease-out) items-center hover:(text-foreground bg-accent/30) focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
          >
            <span class="i-lucide-file-text shrink-0 size-4" aria-hidden="true" />
            <span class="truncate">llms.txt</span>
          </a>
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
          <Badge size="sm" variant="outline" class="font-mono ms-1.5">
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
