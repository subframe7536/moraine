import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'

import { Button, Icon, SidebarFrame, cn } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { DocsCommandPalette } from './docs-command-palette'
import { DOCS_HEADER_CONTROL_CLASS } from './docs-header.class'

export function PageActions(props: {
  pages: DocsPageEntry[]
  paletteOpen: Accessor<boolean>
  setPaletteOpen: (open: boolean) => void
  onNavigate: (key: string) => void
  mobile: boolean
  theme: Accessor<ThemeMode>
  updateTheme: (theme: ThemeMode) => void
}) {
  return (
    <div class="flex shrink-0 gap-1 items-center" aria-label="Page actions">
      <DocsCommandPalette
        pages={props.pages}
        open={props.paletteOpen}
        setOpen={props.setPaletteOpen}
        onNavigate={props.onNavigate}
        variant={props.mobile ? 'mobile' : 'desktop'}
      />
      <Show when={!props.mobile}>
        <Button
          as="a"
          href="https://github.com/subframe7536/moraine"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="icon-sm"
          aria-label="GitHub repository"
          class={cn(DOCS_HEADER_CONTROL_CLASS, 'size-9')}
        >
          <Icon name="i-lucide:github" class="size-4" />
        </Button>
      </Show>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={props.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={props.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => props.updateTheme(props.theme() === 'dark' ? 'light' : 'dark')}
        class={cn(DOCS_HEADER_CONTROL_CLASS, props.mobile ? 'size-11' : 'size-9')}
      >
        <Icon name={props.theme() === 'dark' ? 'i-lucide:moon' : 'i-lucide:sun'} class="size-4" />
      </Button>
      <Show when={props.mobile}>
        <SidebarFrame.Trigger
          as={Button}
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle sidebar"
          class={cn(DOCS_HEADER_CONTROL_CLASS, 'size-11 -me-3')}
        >
          <Icon name="i-lucide:menu" class="size-5" />
        </SidebarFrame.Trigger>
      </Show>
    </div>
  )
}
