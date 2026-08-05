import { Button, CommandPalette, Dialog, Icon } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

export function WithCloseButton() {
  const [open, setOpen] = createSignal(false)
  const BASIC_GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        {
          value: 'new-issue',
          label: 'New Issue',
          leadingRender: () => <Icon name="i-lucide-circle-plus" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">⌘N</span>,
        },
        {
          value: 'open-inbox',
          label: 'Open Inbox',
          leadingRender: () => <Icon name="i-lucide-inbox" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">GI</span>,
        },
        {
          value: 'sync-roadmap',
          label: 'Sync Roadmap',
          leadingRender: () => <Icon name="i-lucide-refresh-cw" />,
          description: 'Pull the latest planning updates',
        },
      ],
    },
    {
      id: 'navigation',
      label: 'Navigation',
      items: [
        {
          value: 'go-dashboard',
          label: 'Dashboard',
          leadingRender: () => <Icon name="i-lucide-layout-dashboard" />,
        },
        {
          value: 'go-projects',
          label: 'Projects',
          leadingRender: () => <Icon name="i-lucide-folder-kanban" />,
        },
        {
          value: 'go-settings',
          label: 'Settings',
          leadingRender: () => <Icon name="i-lucide-settings" />,
          description: 'Preferences',
        },
        {
          value: 'go-billing',
          label: 'Billing',
          leadingRender: () => <Icon name="i-lucide-credit-card" />,
          disabled: true,
        },
      ],
    },
  ]

  return (
    <div class="max-w-full w-lg">
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        close={false}
        classes={{ body: 'p-0 mb-0' }}
        body={<CommandPalette groups={BASIC_GROUPS} showClose onClose={() => setOpen(false)} />}
      >
        {(props) => (
          <Button {...props} variant="outline">
            Open palette
          </Button>
        )}
      </Dialog>
    </div>
  )
}
