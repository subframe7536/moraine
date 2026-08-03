import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

import { Button, CommandPalette, Dialog, Icon, KbdGroup } from '../../../../src'
import type { CommandPaletteT } from '../../../../src'

import type { SidebarPage } from './sidebar'

export type DocsCommandPaletteVariant = 'desktop' | 'mobile'

export interface DocsCommandPaletteProps {
  pages: SidebarPage[]
  onNavigate: (key: string) => void
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  variant?: DocsCommandPaletteVariant
}

export function buildDocsCommandItems(pages: SidebarPage[]): CommandPaletteT.Group[] {
  const grouped = new Map<string, CommandPaletteT.Item[]>()
  const ungrouped: CommandPaletteT.Item[] = []

  for (const page of pages) {
    const item: CommandPaletteT.Item = {
      value: page.key,
      label: page.label,
      description: page.description,
      keywords: page.tags,
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
  onOpen?: () => void
  variant?: DocsCommandPaletteVariant
  class?: string
}): JSX.Element {
  const variant = () => props.variant ?? 'desktop'

  return (
    <Button
      aria-label="Open search"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => props.onOpen?.()}
      variant="outline"
      size={variant() === 'mobile' ? 'icon-sm' : 'md'}
      leading="i-lucide-search"
      trailing={
        <Show when={variant() === 'desktop'}>
          <KbdGroup items={['⌘', 'K']} variant="outline" />
        </Show>
      }
      class={props.class}
    >
      <Show when={variant() === 'desktop'}>Search docs</Show>
    </Button>
  )
}

export function DocsCommandPalette(props: DocsCommandPaletteProps): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal('')

  const onSelect = (item: CommandPaletteT.Item) => {
    props.onNavigate(item.value)
  }

  const onClose = () => {
    props.setOpen(false)
  }

  const items = createMemo(() => buildDocsCommandItems(props.pages))

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        event.stopImmediatePropagation()
        props.setOpen(!props.open())
        return
      }

      if (event.key === '/' && !isEditable && !props.open()) {
        event.preventDefault()
        props.setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown, true))
  })

  return (
    <Dialog
      open={props.open()}
      onOpenChange={(next) => {
        props.setOpen(next)
      }}
      onExitComplete={() => setSearchTerm('')}
      close={false}
      classes={{ body: 'p-0 mb-0' }}
      body={
        <CommandPalette
          groups={items()}
          placeholder="Search components, hooks, and pages..."
          searchTerm={searchTerm()}
          onSearchTermChange={setSearchTerm}
          onSelect={onSelect}
          showClose
          onClose={onClose}
          emptyRender={(ctx) => (
            <div class="flex flex-col gap-2 items-center">
              <Icon name="i-lucide-search-x" class="size-5" />
              <span>
                No pages found for{' '}
                <span class="text-foreground font-medium">“{ctx.searchTerm}”</span>.
              </span>
            </div>
          )}
          footerRender={(ctx) => (
            <div class="flex gap-4 items-center justify-between">
              <span>
                {ctx.visibleGroups.reduce((count, group) => count + (group.items?.length ?? 0), 0)}{' '}
                matches
              </span>
              <div class="flex gap-3 items-center" aria-label="Keyboard shortcuts">
                <span class="flex gap-1.5 items-center">
                  <KbdGroup
                    items={['arrowup', 'arrowdown']}
                    size="xs"
                    variant="outline"
                    dividerRender={() => '/'}
                  />
                  Navigate
                </span>
                <span class="flex gap-1.5 items-center">
                  <KbdGroup items={['enter']} size="xs" variant="outline" />
                  Open
                </span>
                <span class="flex gap-1.5 items-center">
                  <KbdGroup items={['escape']} size="xs" variant="outline" />
                  Close
                </span>
              </div>
            </div>
          )}
        />
      }
    >
      <DocsSearchTrigger variant={props.variant} />
    </Dialog>
  )
}
