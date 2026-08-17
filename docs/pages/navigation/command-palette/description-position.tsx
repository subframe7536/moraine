import { Badge, CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        value: 'inbox',
        label: 'Inbox',
        description: '24 unread messages across all teams',
        leadingRender: () => <Icon name="i-lucide-inbox" />,
        trailingRender: () => <Badge variant="default">24</Badge>,
      },
      {
        value: 'settings',
        label: 'Settings',
        description: 'Workspace preferences and billing',
        leadingRender: () => <Icon name="i-lucide-settings" />,
      },
    ],
  },
]

export function DescriptionPosition() {
  return (
    <div class="max-w-full w-lg">
      <CommandPalette groups={GROUPS} autofocus={false} descriptionPosition="trailing" />
    </div>
  )
}
