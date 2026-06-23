import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'

export function SubNavigation() {
  const SUB_NAV_GROUPS: CommandPaletteT.Item[] = [
    {
      id: 'main',
      label: 'Commands',
      children: [
        {
          value: 'create',
          label: 'Create',
          icon: 'i-lucide-plus-circle',
          description: 'Create new resources',
          children: [
            { value: 'create-new-file', label: 'New File', icon: 'i-lucide-file-plus' },
            { value: 'create-new-folder', label: 'New Folder', icon: 'i-lucide-folder-plus' },
            { value: 'create-new-project', label: 'New Project', icon: 'i-lucide-git-branch' },
          ],
        },
        {
          value: 'share',
          label: 'Share',
          icon: 'i-lucide-share-2',
          description: 'Share with others',
          children: [
            {
              value: 'share-copy-link',
              label: 'Copy Link',
              icon: 'i-lucide-link',
              kbds: ['⌘', 'L'],
            },
            { value: 'share-send-email', label: 'Send via Email', icon: 'i-lucide-mail' },
          ],
        },
        { value: 'delete', label: 'Delete', icon: 'i-lucide-trash-2' },
      ],
    },
  ]

  return (
    <div class="max-w-full w-lg">
      <CommandPalette items={SUB_NAV_GROUPS} />
    </div>
  )
}
