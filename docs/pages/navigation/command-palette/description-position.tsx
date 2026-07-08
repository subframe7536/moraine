import { Badge, Button, CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        value: 'inbox',
        label: 'Inbox',
        description: '24 unread messages across all teams',
        leadingRender: () => <span class="i-lucide-inbox" />,
        trailingRender: () => <Badge variant="default">24</Badge>,
      },
      {
        value: 'settings',
        label: 'Settings',
        description: 'Workspace preferences and billing',
        leadingRender: () => <span class="i-lucide-settings" />,
      },
    ],
  },
]

export function DescriptionPosition() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-full w-lg">
      <CommandPalette
        open={open()}
        onOpenChange={setOpen}
        groups={GROUPS}
        descriptionPosition="trailing"
      >
        <Button variant="outline">Open navigation</Button>
      </CommandPalette>
    </div>
  )
}
