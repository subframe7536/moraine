import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

import { Button, CommandPalette, Icon, KbdGroup, cn } from '../../src'
import type { CommandPaletteT } from '../../src'

import type { SidebarPage } from './sidebar'

export type DocsCommandPaletteVariant = 'desktop' | 'mobile'

export interface DocsCommandPaletteProps {
  pages: SidebarPage[]
  onNavigate: (key: string) => void
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
}

export function buildDocsCommandItems(
  pages: SidebarPage[],
  onNavigate: (key: string) => void,
): CommandPaletteT.Group[] {
  const grouped = new Map<string, CommandPaletteT.Item[]>()
  const ungrouped: CommandPaletteT.Item[] = []

  for (const page of pages) {
    const item: CommandPaletteT.Item = {
      value: page.key,
      label: page.label,
      description: page.description,
      keywords: page.tags,
      onSelect: () => onNavigate(page.key),
    }
    const group = page.group?.trim()
    if (!group) {
      ungrouped.push(item)
      continue
    }
    const list = grouped.get(group) ?? []
    list.push(item)
    grouped.set(group, list)
  }

  const items: CommandPaletteT.Group[] = []
  if (ungrouped.length > 0) {
    items.push({ id: 'ungrouped', items: ungrouped })
  }
  for (const [group, groupItems] of grouped.entries()) {
    items.push({
      id: `group-${group}`,
      label: group.charAt(0).toUpperCase() + group.slice(1),
      items: groupItems,
    })
  }
  return items
}

export function DocsSearchTrigger(props: {
  onOpen: () => void
  variant?: DocsCommandPaletteVariant
  class?: string
}): JSX.Element {
  const variant = () => props.variant ?? 'desktop'

  return (
    <Button
      aria-label="Open search"
      onClick={() => props.onOpen()}
      variant="ghost"
      size={variant() === 'mobile' ? 'icon-sm' : 'sm'}
      class={cn(
        variant() === 'mobile'
          ? 'text-muted-foreground hover:(text-foreground bg-accent/50)'
          : 'text-sm text-muted-foreground px-3 b-1 b-border bg-background/70 flex-1 gap-2 max-w-xs justify-start hover:(border-border bg-background)',
        props.class,
      )}
    >
      <Icon name="i-lucide-search" class="shrink-0 size-4" />
      <Show when={variant() === 'desktop'}>
        <span class="text-left flex-1 truncate">Search...</span>
        <KbdGroup
          items={['⌘', 'K']}
          size="xs"
          variant="outline"
          // classes={{ item: 'text-[0.65rem]' }}
        />
      </Show>
    </Button>
  )
}

export function DocsCommandPalette(props: DocsCommandPaletteProps): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal('')

  const navigate = (key: string) => {
    props.onNavigate(key)
    props.setOpen(false)
    setSearchTerm('')
  }

  const items = createMemo(() => buildDocsCommandItems(props.pages, navigate))

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        props.setOpen(!props.open())
        return
      }

      if (event.key === '/' && !isEditable && !props.open()) {
        event.preventDefault()
        props.setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown))
  })

  return (
    <CommandPalette
      open={props.open()}
      onOpenChange={(next) => {
        props.setOpen(next)
        if (!next) {
          setSearchTerm('')
        }
      }}
      groups={items()}
      placeholder="Search components, hooks, and pages..."
      searchTerm={searchTerm()}
      onSearchTermChange={setSearchTerm}
      emptyRender={() => 'No matching pages.'}
      classes={{
        content: 'p-0 overflow-hidden',
        root: 'rounded-xl',
        inputWrapper: 'b-(b border) h-12',
        listbox: 'max-h-[min(60vh,30rem)] py-2',
      }}
    />
  )
}
