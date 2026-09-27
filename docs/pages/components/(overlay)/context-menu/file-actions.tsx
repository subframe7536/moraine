import { Button, ContextMenu, Icon } from '@src'
import type { ContextMenuT } from '@src'
import { createMemo, createSignal, Show } from 'solid-js'

export function FileActions() {
  const [folder, setFolder] = createSignal('Projects')
  const [favorite, setFavorite] = createSignal(false)
  const [deleted, setDeleted] = createSignal(false)
  const [status, setStatus] = createSignal('Right click the file, long press, or use Shift + F10.')
  const items = createMemo<ContextMenuT.Item[]>(() => [
    {
      type: 'group',
      label: 'Project brief.pdf',
      children: [
        {
          label: 'Open preview',
          icon: 'i-lucide:eye',
          onSelect: () => setStatus('Preview ready: Project brief.pdf · 4 pages · 240 KB'),
        },
        {
          type: 'checkbox',
          label: 'Add to favorites',
          checked: favorite(),
          onCheckedChange: (checked) => {
            setFavorite(checked)
            setStatus(checked ? 'Added to favorites.' : 'Removed from favorites.')
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Move to',
      icon: 'i-lucide:folder-input',
      children: ['Projects', 'Shared', 'Archive'].map((destination) => ({
        label: destination,
        icon: 'i-lucide:folder',
        disabled: folder() === destination,
        onSelect: () => {
          setFolder(destination)
          setStatus(`Moved to ${destination}.`)
        },
      })),
    },
    {
      label: 'Manage access',
      description: 'Only the owner can change permissions',
      icon: 'i-lucide:lock',
      disabled: true,
    },
    { type: 'separator' },
    {
      label: 'Move to trash',
      icon: 'i-lucide:trash-2',
      variant: 'destructive',
      onSelect: () => {
        setDeleted(true)
        setStatus('Project brief.pdf moved to trash.')
      },
    },
  ])

  return (
    <section class="max-w-lg w-full space-y-3" aria-label="File actions example">
      <Show
        when={!deleted()}
        fallback={
          <div class="p-4 border border-border border-dashed flex gap-3 items-center justify-between rounded-lg">
            <span class="text-muted-foreground text-sm">File is in the trash</span>
            <Button
              variant="outline"
              onClick={() => {
                setDeleted(false)
                setStatus('Project brief.pdf restored.')
              }}
            >
              Undo
            </Button>
          </div>
        }
      >
        <ContextMenu>
          <ContextMenu.Trigger
            class="p-4 outline-none border border-border bg-card flex gap-3 select-none items-center rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Actions for Project brief.pdf"
          >
            <Icon name="i-lucide:file-text" class="text-muted-foreground shrink-0 size-8" />
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate text-sm">Project brief.pdf</p>
              <p class="text-muted-foreground text-xs">{folder()} · 240 KB</p>
            </div>
            <Show when={favorite()}>
              <Icon name="i-lucide:star" class="text-primary size-4" />
            </Show>
          </ContextMenu.Trigger>
          <ContextMenu.Content items={items()} />
        </ContextMenu>
      </Show>
      <p role="status" class="text-muted-foreground text-xs">
        {status()}
      </p>
    </section>
  )
}
