import { CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'

const COMMAND_GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        value: 'dash',
        label: 'Go to Dashboard',
        leadingRender: () => <Icon name="i-lucide:layout-dashboard" />,
      },
      {
        value: 'settings',
        label: 'Go to Settings',
        leadingRender: () => <Icon name="i-lucide:settings" />,
      },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        value: 'new-proj',
        label: 'Create new project',
        leadingRender: () => <Icon name="i-lucide:folder-plus" />,
      },
      {
        value: 'invite',
        label: 'Invite team member',
        leadingRender: () => <Icon name="i-lucide:user-plus" />,
      },
    ],
  },
]

export function GroupsFiltering() {
  return (
    <div class="b-(1 border) rounded-xl max-w-md w-full shadow-lg overflow-hidden">
      <CommandPalette
        autofocus={false}
        placeholder="Type a command or search..."
        groups={COMMAND_GROUPS}
      />
    </div>
  )
}
