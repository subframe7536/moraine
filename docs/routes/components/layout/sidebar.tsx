import { useLocation } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onCleanup } from 'solid-js'

import { Badge, Icon, Sidebar, cn } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'
import type { DocsPageEntry } from '../../docs-route'

export type SidebarPage = DocsPageEntry

export interface DocsSidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
}

const SURFACES = [
  { value: 'docs', label: 'Docs', href: '/docs/getting-started', icon: 'i-lucide:book-open' },
  { value: 'components', label: 'Components', href: '/components', icon: 'i-lucide:layout-grid' },
  { value: 'hooks', label: 'Hooks', href: '/hooks', icon: 'i-lucide:anchor' },
] as const

function getCurrentSurface(pathname: string) {
  if (pathname.startsWith('/component')) {
    return 'components'
  }
  if (pathname.startsWith('/hook')) {
    return 'hooks'
  }
  return 'docs'
}

export const DocsSidebar = (props: DocsSidebarProps) => {
  const frame = Sidebar.useContext()
  const location = useLocation()
  let nav: HTMLElement | undefined
  const currentSurface = createMemo(() => getCurrentSurface(location.pathname))
  const surfaces = createMemo(() => {
    return SURFACES.filter((surface) => surface.value === currentSurface()).map((surface) => {
      const groups = new Map<string, SidebarPage[]>()
      for (const page of props.pages) {
        if (page.surface !== surface.value) {
          continue
        }
        const pages = groups.get(page.section) ?? []
        pages.push(page)
        groups.set(page.section, pages)
      }
      return {
        value: surface.value,
        label: surface.label,
        sections: [...groups.entries()].map(([section, pages]) => ({ section, pages })),
      }
    })
  })

  createEffect(
    on([frame.isMobile, frame.isOpen, () => props.activePage()], ([mobile, open]) => {
      if (!mobile || !open) {
        return
      }
      const request = requestAnimationFrame(() => {
        nav
          ?.querySelector<HTMLElement>('[aria-current="page"]')
          ?.scrollIntoView({ block: 'nearest' })
      })
      onCleanup(() => cancelAnimationFrame(request))
    }),
  )

  const renderSidebarItem = (page: SidebarPage) => (
    <Sidebar.MenuItem>
      <Sidebar.MenuButton
        href={page.path}
        isActive={props.activePage() === page.path}
        class={DOCS_FOCUS_RING_OFFSET_CLASS}
      >
        <span class={frame.isMobile() ? 'break-words min-w-0' : 'truncate'}>{page.label}</span>
        <Show when={page.badge}>
          {(badge) => (
            <Badge variant="outline" size="sm" class="text-[0.7rem] ms-auto px-1.5 py-0">
              {badge()}
            </Badge>
          )}
        </Show>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  )

  const renderSurface = (surface: ReturnType<typeof surfaces>[number]) => (
    <section aria-label={surface.label}>
      <div class="flex flex-col gap-1">
        <For each={surface.sections}>
          {(section) => (
            <>
              <Sidebar.Group aria-label={section.section}>
                <Sidebar.GroupLabel as="h2" class="text-sm text-foreground capitalize">
                  {section.section}
                </Sidebar.GroupLabel>
                <Sidebar.Menu>
                  <For each={section.pages}>{renderSidebarItem}</For>
                </Sidebar.Menu>
              </Sidebar.Group>
              <Show when={surface.value === 'docs' && section.section === 'overview'}>
                <Sidebar.Group aria-label="Agents">
                  <Sidebar.GroupLabel as="h2" class="text-sm text-foreground">
                    Agents
                  </Sidebar.GroupLabel>
                  <Sidebar.Menu>
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton
                        as="a"
                        href="/llms.txt"
                        rel="alternate external"
                        type="text/markdown"
                        class={DOCS_FOCUS_RING_OFFSET_CLASS}
                      >
                        llms.txt
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  </Sidebar.Menu>
                </Sidebar.Group>
              </Show>
            </>
          )}
        </For>
      </div>
      <Show when={surface.sections.length === 0}>
        <p class="text-xs text-muted-foreground px-2 py-3">No results</p>
      </Show>
    </section>
  )

  return (
    <nav
      ref={(element) => {
        nav = element
      }}
      aria-label="Documentation"
      class="px-2 py-3 flex flex-col gap-6"
    >
      <For each={surfaces()}>{renderSurface}</For>
    </nav>
  )
}

export const DocsSidebarHeader = () => {
  const frame = Sidebar.useContext()
  const location = useLocation()
  return (
    <nav
      aria-label="Documentation sections"
      class="font-sans p-3 border-b border-border shrink-0 w-full"
    >
      <div class="p-1 rounded-lg bg-muted/60 gap-1 grid grid-cols-3">
        <For each={SURFACES}>
          {(surface) => {
            const selected = () => getCurrentSurface(location.pathname) === surface.value
            return (
              <a
                href={surface.href}
                onClick={() => {
                  if (frame.isMobile()) {
                    frame.setOpen(false)
                  }
                }}
                class={cn(
                  `text-xs font-medium px-2 py-1.5 rounded-md flex gap-1.5 select-none transition-colors items-center justify-center ${DOCS_FOCUS_RING_OFFSET_CLASS}`,
                  selected()
                    ? 'text-foreground bg-background shadow-xs'
                    : 'text-muted-foreground hover:(text-foreground bg-background/50)',
                )}
                aria-current={selected() ? 'page' : undefined}
              >
                <Icon name={surface.icon} class="shrink-0 size-3.5" />
                <span class="truncate">{surface.label}</span>
              </a>
            )
          }}
        </For>
      </div>
    </nav>
  )
}
