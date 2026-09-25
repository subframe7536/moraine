import type { Accessor } from 'solid-js'

import { Button, Icon, Switch } from '../../../../src'
import type { DocsPageEntry } from '../../docs-route'
import type { ThemeMode } from '../../hooks/use-theme'

import { DocsCommandPalette } from './docs-command-palette'

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
    <div class="flex shrink-0 gap-2 items-center" aria-label="Page actions">
      <DocsCommandPalette
        pages={props.pages}
        open={props.paletteOpen}
        setOpen={props.setPaletteOpen}
        onNavigate={props.onNavigate}
        variant={props.mobile ? 'mobile' : 'desktop'}
      />
      <Button
        as="a"
        href="https://github.com/subframe7536/moraine"
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size="icon-sm"
        aria-label="GitHub repository"
        class="text-muted-foreground hover:text-foreground"
      >
        <Icon name="i-lucide-github" />
      </Button>
      <Switch
        size="sm"
        label="Toggle color theme"
        classes={{ wrapper: 'sr-only' }}
        checked={props.theme() === 'dark'}
        onCheckedChange={(next) => props.updateTheme(next ? 'dark' : 'light')}
        checkedIcon="i-lucide-moon"
        uncheckedIcon="i-lucide-sun"
      />
    </div>
  )
}
