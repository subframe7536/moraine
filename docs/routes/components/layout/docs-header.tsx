import { useLocation } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, cn, useSidebarFrame } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { DOCS_HEADER_CONTROL_CLASS } from './docs-header.class'
import { PageActions } from './page-actions'

export interface DocsHeaderProps {
  pages: DocsPageEntry[]
  paletteOpen: Accessor<boolean>
  setPaletteOpen: (open: boolean) => void
  onNavigate: (key: string) => void
  theme: Accessor<ThemeMode>
  updateTheme: (theme: ThemeMode) => void
}

export function DocsHeader(props: DocsHeaderProps): JSX.Element {
  const frame = useSidebarFrame()
  const location = useLocation()
  const isComponents = createMemo(() => location.pathname.startsWith('/components'))
  const isDocs = createMemo(() => location.pathname.startsWith('/docs'))

  return (
    <header class="font-sans border-b border-border/60 bg-background shrink-0 h-13 z-sticky">
      <nav
        aria-label="Main"
        class="px-5 flex gap-4 h-full w-full items-center justify-between sm:px-8"
      >
        <div class="flex gap-1 min-w-0 items-center">
          <a
            href="/"
            aria-label="Moraine home"
            class="text-foreground flex shrink-0 gap-2 items-center rounded-sm focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)"
          >
            <img src="/favicon.svg" alt="" class="size-6" />
            <span class="font-semibold text-base">Moraine</span>
            <Show when={!frame.isMobile()}>
              <Badge
                size="sm"
                variant="outline"
                class="text-muted-foreground font-mono px-1.5 py-0 text-xs"
              >
                v{packageMetadata.version}
              </Badge>
            </Show>
          </a>
          <Show when={!frame.isMobile()}>
            <div class="ms-5 flex gap-1 items-center">
              <Button
                as="a"
                variant="ghost"
                size="sm"
                href="/docs/getting-started"
                aria-current={isDocs() ? 'true' : undefined}
                class={cn(
                  DOCS_HEADER_CONTROL_CLASS,
                  'px-3 h-9 text-sm',
                  isDocs() ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                Docs
              </Button>
              <Button
                as="a"
                variant="ghost"
                size="sm"
                href="/components"
                aria-current={isComponents() ? 'true' : undefined}
                class={cn(
                  DOCS_HEADER_CONTROL_CLASS,
                  'px-3 h-9 text-sm',
                  isComponents() ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                Components
              </Button>
            </div>
          </Show>
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
