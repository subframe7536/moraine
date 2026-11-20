import { CommandPalette, Icon, KbdGroup } from '@src'
import type { CommandPaletteT } from '@src'

export function Loading() {
  const BASIC_GROUPS: CommandPaletteT.Group[] = [
    {
      type: 'group',
      label: 'Workspace',
      items: [
        {
          value: 'new-issue',
          label: 'New Issue',
          leadingRender: () => <Icon name="i-lucide-circle-plus" />,
          trailingRender: () => <KbdGroup items={['⌘', 'N']} />,
        },
        {
          value: 'open-inbox',
          label: 'Open Inbox',
          leadingRender: () => <Icon name="i-lucide-inbox" />,
          trailingRender: () => <KbdGroup items={['⌘', 'I']} />,
        },
        {
          value: 'sync-roadmap',
          label: 'Sync Roadmap',
          leadingRender: () => <Icon name="i-lucide-refresh-cw" />,
          description: 'Pull the latest planning updates',
        },
      ],
    },
  ]

  return (
    <div class="max-w-full w-lg">
      <CommandPalette items={BASIC_GROUPS} autoFocus={false} loading />
    </div>
  )
}
