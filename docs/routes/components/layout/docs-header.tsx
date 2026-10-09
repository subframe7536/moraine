import { useLocation } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, cn, useSidebarFrame } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.class'
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
        class="px-5 flex gap-4 h-full w-full items-center justify-between sm:px-8 lg:ps-6"
      >
        <div class="flex gap-1 min-w-0 items-center">
          <a
            href="/"
            aria-label="Moraine home"
            class={`text-foreground rounded-sm flex shrink-0 gap-2 items-center ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
          >
            <img src="/favicon.svg" alt="" class="size-6" />
            <span class="text-base font-semibold">Moraine</span>
            <Show when={!frame.isMobile()}>
              <Badge
                size="sm"
                variant="outline"
                class="text-xs text-muted-foreground font-mono px-1.5 py-0"
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
                  'text-sm px-3 h-9',
                  isDocs() ? 'text-foreground underline' : 'text-muted-foreground',
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
                  'text-sm px-3 h-9',
                  isComponents() ? 'text-foreground underline' : 'text-muted-foreground',
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
