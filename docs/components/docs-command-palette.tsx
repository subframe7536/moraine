import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

import { CommandPalette, Dialog, Kbd, cn } from '../../src'
import type { CommandPaletteT } from '../../src'

import type { SidebarPage } from './sidebar'

export type DocsCommandPaletteVariant = 'desktop' | 'mobile'

export interface DocsCommandPaletteProps {
  pages: SidebarPage[]
  onNavigate: (key: string) => void
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
}

function buildItems(
  pages: SidebarPage[],
  onNavigate: (key: string) => void,
): CommandPaletteT.Group[] {
  const grouped = new Map<string, CommandPaletteT.Item[]>()
  const ungrouped: CommandPaletteT.Item[] = []

  for (const page of pages) {
    const item: CommandPaletteT.Item = {
      value: page.key,
      label: page.label,
      description: page.status?.toUpperCase(),
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
  for (const [group, children] of grouped.entries()) {
    items.push({
      id: `group-${group}`,
      label: group.charAt(0).toUpperCase() + group.slice(1),
      items: children,
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
    <button
      type="button"
      aria-label="Open search"
      onClick={() => props.onOpen()}
      class={cn(
        variant() === 'mobile'
          ? 'text-muted-foreground p-2 rounded-md inline-flex h-9 w-9 cursor-pointer items-center justify-center hover:(text-foreground bg-accent/50)'
          : 'text-sm text-muted-foreground px-3 py-1.5 b-1 b-border rounded-md bg-background/70 flex flex-1 gap-2 h-9 max-w-xs cursor-pointer transition-colors items-center hover:(border-border bg-background)',
        props.class,
      )}
    >
      <span class="i-lucide-search shrink-0 size-4 block" aria-hidden="true" />
      <Show when={variant() === 'desktop'}>
        <span class="text-left flex-1 truncate">Search...</span>
        <Kbd size="xs" variant="outline" value={['⌘', 'K']} classes={{ item: 'text-[0.65rem]' }} />
      </Show>
    </button>
  )
}

export function DocsCommandPalette(props: DocsCommandPaletteProps): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal('')

  const navigate = (key: string) => {
    props.onNavigate(key)
    props.setOpen(false)
    setSearchTerm('')
  }

  const items = createMemo(() => buildItems(props.pages, navigate))

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
    <Dialog
      open={props.open()}
      onOpenChange={(next) => {
        props.setOpen(next)
        if (!next) {
          setSearchTerm('')
        }
      }}
      close={false}
      classes={{
        content: 'p-0 overflow-hidden',
        header: 'hidden',
        body: 'p-0',
      }}
      body={
        <CommandPalette
          groups={items()}
          placeholder="Search components, hooks, and pages..."
          searchTerm={searchTerm()}
          onSearchTermChange={setSearchTerm}
          emptyRender={() => 'No matching pages.'}
          classes={{
            root: 'rounded-xl',
            inputWrapper: 'b-(b border) h-12',
            listbox: 'max-h-[min(60vh,30rem)] py-2',
          }}
        />
      }
    >
      <span class="hidden" aria-hidden="true" />
    </Dialog>
  )
}
