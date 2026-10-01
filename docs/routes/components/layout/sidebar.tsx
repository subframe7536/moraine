import { useLocation } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onCleanup } from 'solid-js'

import { Icon, Badge, cn, useSidebarFrame } from '../../../../src'
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
  const surfaces = createMemo(() => {
    return SURFACES.filter((surface) => surface.value === getCurrentSurface(location.pathname)).map(
      (surface) => {
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
      },
    )
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
    <li class="flex">
      <a
        href={page.path}
        aria-current={props.activePage() === page.path ? ('page' as const) : undefined}
        class={cn(
          'px-2.5 py-1.5 text-left flex w-full transition-colors items-center text-sm rounded-lg focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
          frame.isMobile() ? 'min-h-11' : '',
          props.activePage() === page.path
            ? 'text-primary bg-primary/10 dark:bg-primary/15'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        )}
      >
        <span class="flex gap-2 min-w-0 w-full items-center justify-between">
          <span class={frame.isMobile() ? 'break-words min-w-0' : 'truncate'}>{page.label}</span>{' '}
          <Show when={page.badge}>
            {(badge) => (
              <Badge variant="outline" size="sm" class="text-[0.7rem] px-1.5 py-0 shrink-0">
                {badge()}
              </Badge>
            )}
          </Show>
        </span>
      </a>
    </li>
  )

  const renderSurface = (surface: ReturnType<typeof surfaces>[number]) => (
    <section aria-label={surface.label}>
      <div class="flex flex-col gap-5">
        <For each={surface.sections}>
          {(section) => (
            <>
              <section aria-label={section.section}>
                <h2 class="text-foreground tracking-tight font-semibold mb-1.5 mt-3 px-2 py-0.5 capitalize text-sm">
                  {section.section}
                </h2>
                <ul class="flex flex-col gap-0.5">
                  <For each={section.pages}>{renderSidebarItem}</For>
                </ul>
              </section>
              <Show when={surface.value === 'docs' && section.section === 'overview'}>
                <section aria-label="Agents">
                  <h2 class="text-foreground tracking-tight font-semibold mb-1.5 mt-3 px-2 py-0.5 text-sm">
                    Agents
                  </h2>
                  <a
                    href="/llms.txt"
                    rel="alternate external"
                    type="text/markdown"
                    class={cn(
                      'text-muted-foreground px-2.5 py-1.5 flex items-center text-sm rounded-lg hover:(text-foreground bg-muted/60) focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
                      frame.isMobile() ? 'min-h-11' : '',
                    )}
                  >
                    llms.txt
                  </a>
                </section>
              </Show>
            </>
          )}
        </For>
      </div>
      <Show when={surface.sections.length === 0}>
        <p class="text-muted-foreground px-2 py-3 text-xs">No results</p>
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
                'font-medium px-3 border flex gap-3 h-12 transition-colors items-center relative text-sm rounded-lg focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
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
                  'flex shrink-0 size-6 items-center justify-center rounded-md',
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
