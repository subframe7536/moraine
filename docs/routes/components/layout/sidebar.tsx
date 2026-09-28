import { useLocation, useNavigate } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Icon, Badge, Button, cn, List, Tabs } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'

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
  section: string
  pages: SidebarPage[]
}

export const Sidebar = (props: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentSurface = createMemo(() =>
    location.pathname.startsWith('/components') ? 'components' : 'docs',
  )
  const grouped = createMemo<SidebarSection[]>(() => {
    const groupedMap = new Map<string, SidebarPage[]>()

    for (const page of props.pages) {
      if (page.surface === 'components' && page.path === '/components') {
        continue
      }
      const group = page.section

      const list = groupedMap.get(group) ?? []
      list.push(page)
      groupedMap.set(group, list)
    }

    return [...groupedMap.entries()].map(([section, pages]) => ({ section, pages }))
  })

  const renderSidebarItem = (page: SidebarPage) => (
    <a
      href={page.path}
      aria-current={props.activePage() === page.path ? ('page' as const) : undefined}
      class={cn(
        'px-2.5 py-1.5 text-left transition-([background-color,color] duration-150 ease-out) text-sm rounded-lg hover:cursor-pointer',
        props.activePage() === page.path
          ? 'text-primary bg-primary/10 dark:bg-primary/15'
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
          props.setActivePage(page.path)
        }
      }}
    >
      <span class="flex gap-2 min-w-0 w-full items-center justify-between">
        <span class="truncate">{page.label}</span>
        <Show when={page.badge}>
          {(badge) => (
            <Badge variant="outline" size="sm" class="text-[0.7rem] px-1.5 py-0">
              {badge()}
            </Badge>
          )}
        </Show>
      </span>
    </a>
  )

  return (
    <div class="px-4 pb-10 pt-3 bg-background h-full min-h-0 overflow-y-auto">
      <Tabs
        class="mb-3 sm:hidden"
        value={currentSurface()}
        onChange={(value) => {
          navigate(value === 'components' ? '/components' : '/docs/getting-started')
        }}
        items={[
          { value: 'docs', label: 'Docs' },
          { value: 'components', label: 'Components' },
        ]}
      />
      <nav class="pb-2 flex flex-col gap-5">
        <For each={grouped()}>
          {(section) => (
            <>
              <section aria-label={section.section}>
                <div class="text-foreground tracking-tight font-bold mb-1.5 mt-3 px-2 py-0.5 capitalize">
                  {section.section}
                </div>

                <List
                  as="div"
                  class="flex flex-col gap-0.5"
                  items={section.pages}
                  itemRender={(context) => renderSidebarItem(context.item)}
                />
              </section>

              <Show when={section.section === 'overview' && props.pages[0]?.surface === 'docs'}>
                <section aria-label="agents">
                  <div class="text-muted-foreground tracking-tight font-medium mb-1.5 mt-3 px-2 py-0.5 bg-muted/60 w-fit uppercase text-xs rounded-md">
                    Agents
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <a
                      href="/llms.txt"
                      rel="alternate external"
                      type="text/markdown"
                      class="text-muted-foreground px-2.5 py-1.5 flex gap-2 transition-([background-color,color] duration-150 ease-out) items-center text-sm rounded-lg hover:(text-foreground bg-muted/60) focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
                    >
                      <span class="truncate">llms.txt</span>
                    </a>
                  </div>
                </section>
              </Show>
            </>
          )}
        </For>

        <Show when={grouped().length === 0}>
          <p class="text-muted-foreground px-2 py-3 text-xs">No results</p>
        </Show>
      </nav>
    </div>
  )
}

export const SidebarHeader = (props: SidebarHeaderProps) => {
  return (
    <div
      class={cn('px-4 flex h-13 w-full items-center justify-between', props.isMobile ? 'mt-1' : '')}
    >
      <a
        href="/"
        class="flex gap-2.5 min-w-0 items-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
        aria-label="Moraine home"
      >
        <img src="/favicon.svg" alt="" class="size-6" />
        <span class="font-semibold flex truncate items-center text-base">
          Moraine
          <Badge size="sm" variant="outline" class="text-[0.7rem] font-mono ms-2 px-1.5 py-0">
            v{version}
          </Badge>
        </span>
      </a>
      <Show when={props.onClose}>
        <Button variant="ghost" size="icon-sm" aria-label="Close sidebar" onClick={props.onClose}>
          <Icon name="icon-close" />
        </Button>
      </Show>
    </div>
  )
}
