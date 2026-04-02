import type { Accessor, JSX } from 'solid-js'

import { Switch, cn } from '../../src'
import { buttonVariants } from '../../src/elements/button/button.class'

export interface ContentHeaderProps {
  pageTitle: Accessor<string>
  scrolled: Accessor<boolean>
  theme: Accessor<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => void
  leading?: JSX.Element
}

export function ContentHeader(props: ContentHeaderProps) {
  return (
    <header
      class={cn(
        'px-4 bg-background/70 flex h-12 transition-shadow duration-300 items-center top-0 justify-between sticky z-10 backdrop-blur-md sm:px-6',
        props.scrolled() && 'shadow-sm',
      )}
    >
      <div class="flex gap-1 min-w-0 items-center">
        {props.leading}
        <span
          class={cn(
            'text-sm text-foreground font-semibold truncate transition-([opacity,transform] duration-200) lg:text-lg',
            props.scrolled()
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 pointer-events-none translate-y-2',
          )}
        >
          {props.pageTitle()}
        </span>
      </div>
      <div class="flex shrink-0 gap-3 items-center" aria-label="Page actions">
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
