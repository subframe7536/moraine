import { CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'

export function Loading() {
  const BASIC_GROUPS: CommandPaletteT.Item[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      children: [
        { value: 'new-issue', label: 'New Issue', icon: 'i-lucide-circle-plus', kbds: ['⌘', 'N'] },
        {
          value: 'open-inbox',
          label: 'Open Inbox',
          icon: 'i-lucide-inbox',
          kbds: ['G', 'I'],
        },
        {
          value: 'sync-roadmap',
          label: 'Sync Roadmap',
          icon: 'i-lucide-refresh-cw',
          description: 'Pull the latest planning updates',
        },
      ],
    },
  ]

  return (
    <div class="max-w-full w-lg">
      <CommandPalette items={BASIC_GROUPS} loading />
    </div>
  )
}
