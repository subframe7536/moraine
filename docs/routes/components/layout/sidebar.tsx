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
            <section aria-label={section.group}>
              <Show when={section.group}>
                <div class="text-xs text-muted-foreground/80 tracking-tight font-bold mb-1.5 mt-3 px-2 uppercase">
                  {section.group}
                </div>
              </Show>

              <List<SidebarPage, 'div'>
                as="div"
                class="flex flex-col gap-0.5"
                items={section.pages}
                itemRender={(context) => (
                  <a
                    href={context.item.path}
                    aria-current={
                      props.activePage() === context.item.key ? ('page' as const) : undefined
                    }
                    class={cn(
                      'text-sm px-2.5 py-1.5 text-left rounded-lg transition-([background-color,color] duration-150 ease-out) hover:cursor-pointer',
                      props.activePage() === context.item.key
                        ? 'text-primary font-medium bg-primary/10 dark:bg-primary/15'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    )}
                    onClick={(event) => {
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        props.setActivePage(context.item.key)
                      }
                    }}
                  >
                    <span class="flex gap-2 min-w-0 w-full items-center justify-between">
                      <span class="truncate">{context.item.label}</span>
                      <Show when={context.item.badge}>
                        {(badge) => (
                          <Badge variant="outline" size="sm" class="text-[0.7rem] px-1.5 py-0">
                            {badge()}
                          </Badge>
                        )}
                      </Show>
                    </span>
                  </a>
                )}
              />
            </section>
          )}
        </For>

        <Show when={grouped().length === 0}>
          <p class="text-xs text-muted-foreground px-2 py-3">No results</p>
        </Show>

        <section>
          <div class="text-xs text-muted-foreground/80 tracking-tight font-semibold mb-1.5 mt-3 px-2 uppercase">
            Resources
          </div>
          <a
            href="/llms.txt"
            rel="alternate external"
            type="text/markdown"
            class="text-sm text-muted-foreground px-2.5 py-1.5 rounded-sm flex gap-2 transition-([background-color,color] duration-150 ease-out) items-center hover:(text-foreground bg-muted/60) focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
          >
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
        props.isMobile ? 'mt-1' : '',
      )}
    >
      <div class="flex gap-2.5 min-w-0 items-center">
        <img src="/favicon.svg" alt="icon" class="size-6" />
        <p class="text-base font-semibold flex truncate items-center">
          Moraine
          <Badge size="sm" variant="outline" class="text-[0.7rem] font-mono ms-2 px-1.5 py-0">
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
