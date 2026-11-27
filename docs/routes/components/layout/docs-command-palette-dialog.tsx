import { useNavigate } from '@solidjs/router'
import type { JSX } from '@solidjs/web'
import { Show, createMemo, createSignal } from 'solid-js'

import { CommandPalette, Dialog, Icon, KbdGroup } from '../../../../src'
import type { CommandPaletteT } from '../../../../src'

import { DocsSearchTrigger, buildDocsCommandItems } from './docs-command-palette'
import type { DocsCommandPaletteProps } from './docs-command-palette'

interface DocsCommandItem extends CommandPaletteT.Item {
  href: string
  icon?: string
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
      tabindex={-1}
      aria-label={`${context.item.description}: ${context.item.label}`}
      class="flex flex-1 gap-2.5 min-w-0 items-center"
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
      <Show when={context.item.icon}>
        {(icon) => (
          <span class="text-muted-foreground rounded bg-muted/60 flex shrink-0 size-6 items-center justify-center group-data-[highlighted]:(text-accent-foreground bg-accent)">
            <Icon name={icon()} class="text-xs" />
          </span>
        )}
      </Show>
      <span class="flex flex-1 flex-col min-w-0">
        <span class="text-sm leading-snug font-medium truncate">{context.item.label}</span>
        <span class="text-xs text-muted-foreground leading-tight truncate group-data-[highlighted]:text-accent-foreground/80">
          {context.item.description}
        </span>
      </span>
      <span class="text-xs text-muted-foreground pe-1 opacity-0 flex shrink-0 transition-opacity items-center group-data-[highlighted]:opacity-100">
        <Icon name="i-lucide:corner-down-left" class="size-3.5" />
      </span>
    </a>
  )
}

export function DocsCommandPaletteDialog(props: DocsCommandPaletteProps): JSX.Element {
  const [searchValue, setSearchValue] = createSignal('')
  const navigate = useNavigate()

  const onSelect = (item: DocsCommandItem) => {
    navigate(item.href, { scroll: false })
    props.onNavigate(item.href)
  }

  const onClose = () => {
    props.setOpen(false)
  }

  const items = createMemo(() => buildDocsCommandItems(props.pages, Boolean(searchValue().trim())))

  return (
    <Dialog
      open={props.open()}
      onOpenChange={(next) => {
        props.setOpen(next)
      }}
      onExitComplete={() => setSearchValue('')}
      closable={false}
    >
      <Dialog.Trigger as={DocsSearchTrigger} variant={props.variant} />
      <Dialog.Content class="p-0 overflow-hidden sm:max-w-xl">
        <Dialog.Body class="mb-0 p-0">
          <CommandPalette<DocsCommandItem>
            class="border-0 rounded-none bg-transparent shadow-none"
            items={items()}
            placeholder="Search components, hooks, and pages..."
            searchValue={searchValue()}
            onSearchValueChange={setSearchValue}
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
            closable
            onCloseRequest={onClose}
            emptyRender={(ctx) => (
              <div class="py-6 flex flex-col gap-2 items-center">
                <Icon name="i-lucide:search-x" class="text-2xl text-muted-foreground/60" />
                <span class="text-sm text-muted-foreground">
                  No pages found for{' '}
                  <span class="text-foreground font-medium">“{ctx.searchValue}”</span>
                </span>
              </div>
            )}
            footerRender={(ctx) => (
              <div class="flex w-full items-center justify-between">
                <span>
                  {ctx.visibleGroups.reduce(
                    (count, group) => count + (group.children?.length ?? 0),
                    0,
                  )}{' '}
                  matches
                </span>
                <div class="gap-3 hidden items-center sm:flex" aria-label="Keyboard shortcuts">
                  <span class="flex gap-1.5 items-center">
                    <KbdGroup
                      items={['arrowup', 'arrowdown']}
                      size="sm"
                      variant="outline"
                      separator="/"
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
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  )
}

export default DocsCommandPaletteDialog
