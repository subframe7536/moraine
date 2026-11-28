import { useLocation } from '@solidjs/router'
import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, ToggleButton, cn } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { DOCS_HEADER_CONTROL_CLASS } from './docs-header.recipe'
import { PageActions } from './page-actions'
export interface DocsHeaderProps {
  pages: Array<DocsPageEntry>
  paletteOpen: Accessor<boolean>
  setPaletteOpen: (open: boolean) => void
  onNavigate: (key: string) => void
  theme: Accessor<ThemeMode>
  updateTheme: (theme: ThemeMode) => void
}

export function DocsHeader(props: DocsHeaderProps): JSX.Element {
  const location = useLocation()
  const isComponents = createMemo(() => location.pathname.startsWith('/components'))
  const isHooks = createMemo(() => location.pathname.startsWith('/hooks'))
  const isDocs = createMemo(() => location.pathname.startsWith('/docs'))

  return (
    <header class="font-sans bg-background shrink-0 h-13 z-sticky">
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
            <Badge
              size="sm"
              variant="outline"
              class="text-xs text-muted-foreground font-mono px-1.5 py-0 hidden lg:inline-flex"
            >
              v{packageMetadata.version}
            </Badge>
          </a>
          <div class="ms-5 gap-1 hidden items-center lg:flex">
            <ToggleButton
              as="a"
              variant="ghost"
              activeVariant="ghost"
              size="sm"
              href="/docs/getting-started"
              pressed={isDocs()}
              aria-current={isDocs() ? 'true' : undefined}
              class={cn(
                DOCS_HEADER_CONTROL_CLASS,
                'text-sm px-3 h-9 data-pressed:text-foreground data-pressed:underline',
              )}
            >
              Docs
            </ToggleButton>
            <ToggleButton
              as="a"
              variant="ghost"
              activeVariant="ghost"
              size="sm"
              href="/components"
              pressed={isComponents()}
              aria-current={isComponents() ? 'true' : undefined}
              class={cn(
                DOCS_HEADER_CONTROL_CLASS,
                'text-sm px-3 h-9 data-pressed:text-foreground data-pressed:underline',
              )}
            >
              Components
            </ToggleButton>
            <ToggleButton
              as="a"
              variant="ghost"
              activeVariant="ghost"
              size="sm"
              href="/hooks"
              pressed={isHooks()}
              aria-current={isHooks() ? 'true' : undefined}
              class={cn(
                DOCS_HEADER_CONTROL_CLASS,
                'text-sm px-3 h-9 data-pressed:text-foreground data-pressed:underline',
              )}
            >
              Hooks
            </ToggleButton>
          </div>
        </div>
        <PageActions
          pages={props.pages}
          paletteOpen={props.paletteOpen}
          setPaletteOpen={props.setPaletteOpen}
          onNavigate={props.onNavigate}
          theme={props.theme}
          updateTheme={props.updateTheme}
        />
      </nav>
    </header>
  )
}
