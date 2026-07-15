import type { Accessor, JSX } from 'solid-js'

import { Button, Icon, Switch, cn } from '../../src'

export interface ContentHeaderProps {
  pageTitle: Accessor<string>
  scrolled: Accessor<boolean>
  theme: Accessor<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => void
  leading?: JSX.Element
  search?: JSX.Element
}

export function ContentHeader(props: ContentHeaderProps) {
  return (
    <header
      data-scrolled={props.scrolled() ? '' : undefined}
      class={cn(
        'px-4 b-(b transparent) bg-transparent flex h-13 transition-([border-color,box-shadow,background-color] duration-200 ease-out) items-center top-0 justify-between sticky z-10 backdrop-blur-md sm:px-8',
        'data-scrolled:(border-border/80 bg-background/90 shadow-xs)',
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
      <div class="flex shrink-0 gap-2 items-center" aria-label="Page actions">
        {props.search}
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
          onChange={(next) => props.setTheme(next ? 'dark' : 'light')}
          checkedIcon="i-lucide-moon"
          uncheckedIcon="i-lucide-sun"
        />
      </div>
    </header>
  )
}
