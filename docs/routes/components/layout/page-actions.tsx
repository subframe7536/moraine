import type { Accessor } from 'solid-js'

import { Button, Icon, Sidebar, cn } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { DocsCommandPalette } from './docs-command-palette'
import { DOCS_HEADER_CONTROL_CLASS } from './docs-header.recipe'
export function PageActions(props: {
  pages: Array<DocsPageEntry>
  paletteOpen: Accessor<boolean>
  setPaletteOpen: (open: boolean) => void
  onNavigate: (key: string) => void
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
      />
      <Button
        as="a"
        href="https://github.com/subframe7536/moraine"
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size="icon-sm"
        aria-label="GitHub repository"
        class={cn(DOCS_HEADER_CONTROL_CLASS, 'size-9 hidden lg:inline-flex')}
      >
        <Icon name="i-lucide:github" class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={props.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={props.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => props.updateTheme(props.theme() === 'dark' ? 'light' : 'dark')}
        class={cn(DOCS_HEADER_CONTROL_CLASS, 'size-11 lg:size-9')}
      >
        <Icon name={props.theme() === 'dark' ? 'i-lucide:moon' : 'i-lucide:sun'} class="size-4" />
      </Button>
      <Sidebar.Trigger
        as={Button}
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle sidebar"
        class={cn(DOCS_HEADER_CONTROL_CLASS, 'size-11 -me-3 lg:hidden')}
      >
        <Icon name="i-lucide:menu" class="size-5" />
      </Sidebar.Trigger>
    </div>
  )
}
