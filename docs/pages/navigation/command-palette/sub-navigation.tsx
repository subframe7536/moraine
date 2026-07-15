import { Button, CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function SubNavigation() {
  const ROOT_GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'main',
      label: 'Commands',
      items: [
        {
          value: 'create',
          label: 'Create',
          leadingRender: () => <Icon name="i-lucide-plus-circle" />,
          description: 'Create new resources',
        },
        {
          value: 'share',
          label: 'Share',
          leadingRender: () => <Icon name="i-lucide-share-2" />,
          description: 'Share with others',
        },
        {
          value: 'delete',
          label: 'Delete',
          leadingRender: () => <Icon name="i-lucide-trash-2" />,
        },
      ],
    },
  ]
  const CREATE_GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'create',
      label: 'Create',
      items: [
        {
          value: 'create-new-file',
          label: 'New File',
          leadingRender: () => <Icon name="i-lucide-file-plus" />,
        },
        {
          value: 'create-new-folder',
          label: 'New Folder',
          leadingRender: () => <Icon name="i-lucide-folder-plus" />,
        },
        {
          value: 'create-new-project',
          label: 'New Project',
          leadingRender: () => <Icon name="i-lucide-git-branch" />,
        },
      ],
    },
  ]
  const SHARE_GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'share',
      label: 'Share',
      items: [
        {
          value: 'share-copy-link',
          label: 'Copy Link',
          leadingRender: () => <Icon name="i-lucide-link" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">⌘L</span>,
        },
        {
          value: 'share-send-email',
          label: 'Send via Email',
          leadingRender: () => <Icon name="i-lucide-mail" />,
        },
      ],
    },
  ]
  const [open, setOpen] = createSignal(false)
  const [view, setView] = createSignal<'root' | 'create' | 'share'>('root')

  const groups = createMemo(() => {
    switch (view()) {
      case 'create':
        return CREATE_GROUPS
      case 'share':
        return SHARE_GROUPS
      default:
        return ROOT_GROUPS.map((group) =>
          Object.assign(group, {
            items: group.items?.map((item) => ({
              ...item,
              onSelect: () => {
                if (item.value === 'create') {
                  setView('create')
                  return
                }
                if (item.value === 'share') {
                  setView('share')
                }
              },
            })),
          }),
        )
    }
  })

  return (
    <div class="flex flex-col gap-3 max-w-full w-lg">
      <div class="flex gap-3 items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Drive multi-step navigation outside the component by swapping the `groups` prop.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={view() === 'root'}
          onClick={() => setView('root')}
        >
          Back
        </Button>
      </div>
      <CommandPalette open={open()} onOpenChange={setOpen} closeOnSelect={false} groups={groups()}>
        <Button variant="outline">Open palette</Button>
      </CommandPalette>
    </div>
  )
}
