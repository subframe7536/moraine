import type { Accessor, JSX } from 'solid-js'

import { buttonVariants } from '../../src/elements/button/button.class'
import { Switch, cn } from '../../src'

export interface ContentHeaderProps {
  pageTitle: Accessor<string>
  scrolled: Accessor<boolean>
  theme: Accessor<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => void
  leading?: JSX.Element
}

export function ContentHeader(props: ContentHeaderProps) {
  return (
    <header class="sticky top-0 z-10 flex items-center justify-between h-12 px-4 backdrop-blur-md bg-background/70 border-b border-border/40">
      <div class="flex items-center gap-1 min-w-0">
        {props.leading}
        <span
          class={cn(
            'text-sm font-semibold text-foreground transition-(opacity transform duration-200) truncate',
            props.scrolled() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          {props.pageTitle()}
        </span>
      </div>
      <div class="flex items-center gap-0.5 shrink-0" aria-label="Page actions">
        <Switch
          size="sm"
          checked={props.theme() === 'dark'}
          onChange={(next) => props.setTheme(next ? 'dark' : 'light')}
          checkedIcon="i-lucide-moon"
          uncheckedIcon="i-lucide-sun"
        />
        <a
          href="https://github.com/subframe7536/moraine"
          target="_blank"
          rel="noopener noreferrer"
          class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          aria-label="GitHub repository"
        >
          <span class="i-lucide-github block" />
        </a>
      </div>
    </header>
  )
}
