import { useLocation } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onCleanup } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Icon, Badge, Button, cn, useSidebarFrame } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'

const { version } = packageMetadata

export type SidebarPage = DocsPageEntry

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
}

export interface SidebarHeaderProps {
  isMobile?: boolean
  onClose?: () => void
}

const SURFACES = [
  { value: 'docs', label: 'Docs', href: '/docs/getting-started' },
  { value: 'components', label: 'Components', href: '/components' },
] as const

export const Sidebar = (props: SidebarProps) => {
  const frame = useSidebarFrame()
  const location = useLocation()
  let nav: HTMLElement | undefined
  const currentSurface = () => (location.pathname.startsWith('/components') ? 'components' : 'docs')
  const surfaces = createMemo(() => {
    const visible = frame.isMobile()
      ? SURFACES
      : SURFACES.filter((surface) => surface.value === currentSurface())

    return visible.map((surface) => {
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
        href: surface.href,
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

  return (
    <nav
      ref={(element) => {
        nav = element
      }}
      aria-label="Documentation"
      class="px-4 pb-10 pt-3 bg-background flex flex-col gap-8"
      onClick={(event) => {
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
        const anchor = event.target.closest('a')
        if (anchor && frame.isMobile()) {
          frame.setOpen(false)
        }
      }}
    >
      <For each={surfaces()}>
        {(surface) => (
          <section aria-label={surface.label}>
            <Show when={frame.isMobile()}>
              <a
                href={surface.href}
                aria-current={
                  surface.value === 'components' && props.activePage() === surface.href
                    ? 'page'
                    : undefined
                }
                class="text-foreground font-semibold px-2 flex min-h-11 items-center text-base rounded-md focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background) hover:bg-muted/60"
              >
                {surface.label}
              </a>
            </Show>
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
          </section>
        )}
      </For>
      <Show when={surfaces().every((surface) => surface.sections.length === 0)}>
        <p class="text-muted-foreground px-2 py-3 text-xs">No results</p>
      </Show>
    </nav>
  )
}

export const SidebarHeader = (props: SidebarHeaderProps) => {
  return (
    <div
      class={cn('px-4 flex h-13 w-full items-center justify-between', props.isMobile ? 'mt-1' : '')}
    >
      <a
        href="/"
        class="flex gap-2.5 min-h-11 min-w-0 items-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
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
        <Button
          variant="ghost"
          size="icon-sm"
          class="size-11"
          aria-label="Close sidebar"
          onClick={props.onClose}
        >
          <Icon name="icon-close" />
        </Button>
      </Show>
    </div>
  )
}
