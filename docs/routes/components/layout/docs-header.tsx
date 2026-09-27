import { useLocation } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, cn, SidebarFrame, useSidebarFrame } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { PageActions } from './page-actions'

export interface DocsHeaderProps {
  pages: DocsPageEntry[]
  paletteOpen: Accessor<boolean>
  setPaletteOpen: (open: boolean) => void
  onNavigate: (key: string) => void
  theme: Accessor<ThemeMode>
  updateTheme: (theme: ThemeMode) => void
  isLanding: Accessor<boolean>
}

export function DocsHeader(props: DocsHeaderProps): JSX.Element {
  const frame = useSidebarFrame()
  const location = useLocation()
  const isComponents = createMemo(() => location.pathname.startsWith('/components'))
  const isDocs = createMemo(() => location.pathname.startsWith('/docs'))

  return (
    <header class="bg-background/80 shrink-0 h-13 z-sticky backdrop-blur-md">
      <nav aria-label="Main" class="px-4 flex h-13 w-full items-center justify-between sm:px-8">
        <div class="flex gap-2.5 items-center sm:gap-6">
          <Show when={!props.isLanding() && frame.isMobile()}>
            <SidebarFrame.Trigger
              as={Button}
              variant="ghost"
              size="sm"
              leading="i-lucide-menu"
              aria-label="Toggle sidebar"
            />
          </Show>
          <a
            href="/"
            aria-label="Moraine home"
            class="font-semibold flex gap-2 items-center focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
          >
            <img src="/favicon.svg" alt="" class="size-6" />
            <span class="font-semibold text-base">Moraine</span>
            <Badge size="sm" variant="outline" class="text-[0.7rem] font-mono px-1.5 py-0">
              v{packageMetadata.version}
            </Badge>
          </a>
          <div class="gap-4 hidden items-center sm:flex">
            <a
              href="/docs/getting-started"
              class={cn(
                'transition-colors text-sm hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
                isDocs() ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              Docs
            </a>
            <a
              href="/components"
              class={cn(
                'transition-colors text-sm hover:text-foreground focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
                isComponents() ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              Components
            </a>
          </div>
        </div>
        <PageActions
          pages={props.pages}
          paletteOpen={props.paletteOpen}
          setPaletteOpen={props.setPaletteOpen}
          onNavigate={props.onNavigate}
          mobile={frame.isMobile()}
          theme={props.theme}
          updateTheme={props.updateTheme}
        />
      </nav>
    </header>
  )
}
