import { useNavigate } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, onMount, splitProps } from 'solid-js'

import { Button, CommandPalette, Dialog, Icon, KbdGroup } from '../../../../src/index'
import type { CommandPaletteT, DialogT } from '../../../../src/index'

import type { SidebarPage } from './sidebar'

export type DocsCommandPaletteVariant = 'desktop' | 'mobile'

export interface DocsCommandPaletteProps {
  pages: SidebarPage[]
  onNavigate: (path: string) => void
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  variant?: DocsCommandPaletteVariant
}

interface DocsCommandItem extends CommandPaletteT.Item {
  href: string
}

export function buildDocsCommandItems(
  pages: SidebarPage[],
): CommandPaletteT.Group<DocsCommandItem>[] {
  const pageItems: DocsCommandItem[] = []
  const sectionItems: DocsCommandItem[] = []
  const destinations = new Set<string>()

  for (const page of pages) {
    if (!destinations.has(page.path)) {
      pageItems.push({
        href: page.path,
        value: page.path,
        label: page.label,
        description: page.description,
        keywords: [...page.tags, page.path],
      })
      destinations.add(page.path)
    }

    for (const section of page.sections) {
      const href = `${page.path}#${encodeURIComponent(section.id)}`
      if (destinations.has(href)) {
        continue
      }

      sectionItems.push({
        href,
        value: href,
        label: section.label,
        description: page.label,
        keywords: [page.label, page.description, ...page.tags, page.path, section.id],
      })
      destinations.add(href)
    }
  }

  const groups: CommandPaletteT.Group<DocsCommandItem>[] = [
    {
      id: 'pages',
      label: 'Pages',
      items: pageItems,
    },
  ]
  if (sectionItems.length > 0) {
    groups.push({
      id: 'sections',
      label: 'Sections',
      items: sectionItems,
    })
  }
  return groups
}

function isModifiedActivation(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function createDocsCommandItem(
  context: CommandPaletteT.ItemRenderProps<DocsCommandItem>,
  onNavigate: (path: string) => void,
  close: () => void,
): JSX.Element {
  return (
    <a
      href={context.item.href}
      aria-label={`${context.item.description}: ${context.item.label}`}
      class="flex flex-1 flex-col min-w-0"
      onClick={(event) => {
        event.stopPropagation()
        if (isModifiedActivation(event)) {
          return
        }

        event.preventDefault()
        onNavigate(context.item.href)
        close()
      }}
    >
      <span class="truncate">{context.item.label}</span>
      <span class="text-xs text-muted-foreground truncate">{context.item.description}</span>
    </a>
  )
}

export function DocsSearchTrigger(
  props: DialogT.TriggerProps & { variant?: DocsCommandPaletteVariant },
): JSX.Element {
  const [local, triggerProps] = splitProps(props, ['variant'])
  const variant = () => local.variant ?? 'desktop'

  return (
    <Button
      {...triggerProps}
      aria-label="Open search"
      aria-keyshortcuts="Meta+K Control+K"
      variant="outline"
      size={variant() === 'mobile' ? 'icon-sm' : 'md'}
      leading="i-lucide-search"
      trailing={
        <Show when={variant() === 'desktop'}>
          <KbdGroup items={['⌘', 'K']} variant="outline" />
        </Show>
      }
    >
      <Show when={variant() === 'desktop'}>Search docs</Show>
    </Button>
  )
}

export function DocsCommandPalette(props: DocsCommandPaletteProps): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal('')
  const navigate = useNavigate()

  const onSelect = (item: DocsCommandItem) => {
    navigate(item.href, { scroll: false })
    props.onNavigate(item.href)
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
    >
      <Dialog.Trigger as={DocsSearchTrigger} variant={props.variant} />
      <Dialog.Content
        close={false}
        classes={{ body: 'p-0 mb-0' }}
        body={
          <CommandPalette<DocsCommandItem>
            groups={items()}
            placeholder="Search components, hooks, and pages..."
            searchTerm={searchTerm()}
            onSearchTermChange={setSearchTerm}
            onSelect={onSelect}
            itemRender={(context) =>
              createDocsCommandItem(
                context,
                (href) => {
                  navigate(href, { scroll: false })
                  props.onNavigate(href)
                },
                onClose,
              )
            }
            showClose
            onClose={onClose}
            emptyRender={(ctx) => (
              <div class="flex flex-col gap-2 items-center">
                <Icon name="i-lucide-search-x" class="text-base" />
                <span>
                  No pages found for{' '}
                  <span class="text-foreground font-medium">“{ctx.searchTerm}”</span>.
                </span>
              </div>
            )}
            footerRender={(ctx) => (
              <div class="flex gap-4 items-center justify-between">
                <span>
                  {ctx.visibleGroups.reduce(
                    (count, group) => count + (group.items?.length ?? 0),
                    0,
                  )}{' '}
                  matches
                </span>
                <div class="flex gap-3 items-center" aria-label="Keyboard shortcuts">
                  <span class="flex gap-1.5 items-center">
                    <KbdGroup
                      items={['arrowup', 'arrowdown']}
                      size="sm"
                      variant="outline"
                      dividerRender={() => '/'}
                    />
                    Navigate
                  </span>
                  <span class="flex gap-1.5 items-center">
                    <KbdGroup items={['enter']} size="sm" variant="outline" />
                    Open
                  </span>
                  <span class="flex gap-1.5 items-center">
                    <KbdGroup items={['escape']} size="sm" variant="outline" />
                    Close
                  </span>
                </div>
              </div>
            )}
          />
        }
      />
    </Dialog>
  )
}
