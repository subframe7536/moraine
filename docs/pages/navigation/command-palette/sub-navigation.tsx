import { Button, CommandPalette } from '@src'
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
          icon: 'i-lucide-plus-circle',
          description: 'Create new resources',
        },
        {
          value: 'share',
          label: 'Share',
          icon: 'i-lucide-share-2',
          description: 'Share with others',
        },
        { value: 'delete', label: 'Delete', icon: 'i-lucide-trash-2' },
      ],
    },
  ]
  const CREATE_GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'create',
      label: 'Create',
      items: [
        { value: 'create-new-file', label: 'New File', icon: 'i-lucide-file-plus' },
        { value: 'create-new-folder', label: 'New Folder', icon: 'i-lucide-folder-plus' },
        { value: 'create-new-project', label: 'New Project', icon: 'i-lucide-git-branch' },
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
          icon: 'i-lucide-link',
          kbds: ['⌘', 'L'],
        },
        { value: 'share-send-email', label: 'Send via Email', icon: 'i-lucide-mail' },
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
