import { useLocation } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onCleanup } from 'solid-js'

import { Badge, Icon, SidebarFrame, cn, useSidebarFrame } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.class'
import type { DocsPageEntry } from '../../docs-route'

export type SidebarPage = DocsPageEntry

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
}

const SURFACES = [
  { value: 'docs', label: 'Docs', href: '/docs/getting-started', icon: 'i-lucide:book-open' },
  { value: 'components', label: 'Components', href: '/components', icon: 'i-lucide:layout-grid' },
] as const

function getCurrentSurface(pathname: string) {
  return pathname.startsWith('/component') ? 'components' : 'docs'
}

function closeSidebarOnLinkClick(event: MouseEvent, frame: ReturnType<typeof useSidebarFrame>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return
  }
  if (event.target.closest('a') && frame.isMobile()) {
    frame.setOpen(false)
  }
}

export const Sidebar = (props: SidebarProps) => {
  const frame = useSidebarFrame()
  const location = useLocation()
  let nav: HTMLElement | undefined
  const currentSurface = createMemo(() => getCurrentSurface(location.pathname))
  const surfaces = createMemo(() => {
    return SURFACES.filter((surface) => surface.value === currentSurface()).map((surface) => {
      const groups = new Map<string, SidebarPage[]>()
      for (const page of props.pages) {
        if (page.surface !== surface.value || page.path === '/components') {
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
    <SidebarFrame.Item
      href={page.path}
      isActive={props.activePage() === page.path}
      class={DOCS_FOCUS_RING_OFFSET_CLASS}
    >
      <span class={frame.isMobile() ? 'break-words min-w-0' : 'truncate'}>{page.label}</span>
      <Show when={page.badge}>
        {(badge) => (
          <Badge variant="outline" size="sm" class="text-[0.7rem] ml-auto px-1.5 py-0 shrink-0">
            {badge()}
          </Badge>
        )}
      </Show>
    </SidebarFrame.Item>
  )

  const renderSurface = (surface: ReturnType<typeof surfaces>[number]) => (
    <section aria-label={surface.label}>
      <div class="flex flex-col gap-5">
        <For each={surface.sections}>
          {(section) => (
            <>
              <SidebarFrame.Group aria-label={section.section}>
                <SidebarFrame.GroupLabel
                  as="h2"
                  class="text-sm text-foreground mb-1.5 mt-3 px-2 py-0.5 capitalize"
                >
                  {section.section}
                </SidebarFrame.GroupLabel>
                <SidebarFrame.Menu>
                  <For each={section.pages}>{renderSidebarItem}</For>
                </SidebarFrame.Menu>
              </SidebarFrame.Group>
              <Show when={surface.value === 'docs' && section.section === 'overview'}>
                <SidebarFrame.Group aria-label="Agents">
                  <SidebarFrame.GroupLabel
                    as="h2"
                    class="text-sm text-foreground mb-1.5 mt-3 px-2 py-0.5"
                  >
                    Agents
                  </SidebarFrame.GroupLabel>
                  <SidebarFrame.Menu>
                    <SidebarFrame.Item
                      as="a"
                      href="/llms.txt"
                      rel="alternate external"
                      type="text/markdown"
                      class={DOCS_FOCUS_RING_OFFSET_CLASS}
                    >
                      llms.txt
                    </SidebarFrame.Item>
                  </SidebarFrame.Menu>
                </SidebarFrame.Group>
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
      class="px-4 pb-10 pt-3 bg-background flex flex-col gap-8"
      onClick={(event) => closeSidebarOnLinkClick(event, frame)}
    >
      <For each={surfaces()}>{renderSurface}</For>
    </nav>
  )
}

export const SidebarHeader = () => {
  const frame = useSidebarFrame()
  const location = useLocation()
  return (
    <nav
      aria-label="Documentation sections"
      class="font-sans px-4 py-4 border-b border-border flex flex-col gap-1 w-full"
      onClick={(event) => closeSidebarOnLinkClick(event, frame)}
    >
      <For each={SURFACES}>
        {(surface) => {
          const selected = () => getCurrentSurface(location.pathname) === surface.value
          return (
            <a
              href={surface.href}
              aria-current={selected() ? 'location' : undefined}
              class={cn(
                `text-sm font-medium px-3 border rounded-lg flex gap-3 h-12 transition-colors items-center relative ${DOCS_FOCUS_RING_OFFSET_CLASS}`,
                selected()
                  ? 'text-foreground border-border bg-muted'
                  : 'text-muted-foreground border-transparent hover:(text-foreground bg-muted/60)',
              )}
            >
              <Show when={selected()}>
                <span
                  aria-hidden="true"
                  class="rounded-full bg-foreground h-5 w-0.5 left-0 top-1/2 absolute -translate-y-1/2"
                />
              </Show>
              <span
                aria-hidden="true"
                class={cn(
                  'rounded-md flex shrink-0 size-6 items-center justify-center',
                  selected() ? 'bg-foreground/10' : 'bg-muted',
                )}
              >
                <Icon name={surface.icon} class="size-4" />
              </span>
              {surface.label}
            </a>
          )
        }}
      </For>
    </nav>
  )
}
