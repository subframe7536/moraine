import { Badge, Button, CommandPalette, Dialog, Icon } from '@src'
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
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-full w-lg">
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        close={false}
        classes={{ body: 'p-0 mb-0' }}
        body={
          <CommandPalette
            groups={GROUPS}
            descriptionPosition="trailing"
            onClose={() => setOpen(false)}
          />
        }
      >
        {(props) => (
          <Button {...props} variant="outline">
            Open navigation
          </Button>
        )}
      </Dialog>
    </div>
  )
}
