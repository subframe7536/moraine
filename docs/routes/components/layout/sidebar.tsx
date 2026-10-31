import { useLocation } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onCleanup } from 'solid-js'

import { Badge, Sidebar, cn } from '../../../../src'
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
      class="px-2 pb-8 pt-1 bg-background flex flex-col gap-8"
    >
      <For each={surfaces()}>{renderSurface}</For>
    </nav>
  )
}

export const DocsSidebarHeader = () => {
  const location = useLocation()
  return (
    <nav
      aria-label="Documentation sections"
      class="font-sans px-4 py-4 border-b border-border w-full"
    >
      <Sidebar.Menu class="gap-1">
        <For each={SURFACES}>
          {(surface) => {
            const selected = () => getCurrentSurface(location.pathname) === surface.value
            return (
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  href={surface.href}
                  isActive={selected()}
                  leading={surface.icon}
                  class={cn(
                    `font-medium px-3 border rounded-lg gap-3 h-12 transition-colors relative ${DOCS_FOCUS_RING_OFFSET_CLASS}`,
                    selected()
                      ? 'text-foreground border-border bg-muted'
                      : 'border-transparent hover:(text-foreground bg-muted/60)',
                  )}
                >
                  <Show when={selected()}>
                    <span
                      aria-hidden="true"
                      class="rounded-full bg-foreground h-5 w-0.5 start-0 top-1/2 absolute -translate-y-1/2"
                    />
                  </Show>
                  {surface.label}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            )
          }}
        </For>
      </Sidebar.Menu>
    </nav>
  )
}
