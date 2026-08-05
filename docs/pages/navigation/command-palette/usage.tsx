import { Button, CommandPalette, Dialog, Icon, Kbd, KbdGroup } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'workspace',
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

export function Usage() {
  const [open, setOpen] = createSignal(false)

  return (
    <Dialog
      open={open()}
      onOpenChange={setOpen}
      close={false}
      classes={{ body: 'p-0 mb-0' }}
      body={
        <CommandPalette
          groups={GROUPS}
          showClose
          onClose={() => setOpen(false)}
          footerRender={() => (
            <div class="flex gap-4 items-center justify-between">
              <div class="flex flex-wrap gap-3 items-center">
                <div class="flex gap-2 items-center">
                  <KbdGroup items={['↑', '↓']} />
                  <span class="text-xs">Navigate</span>
                </div>
                <div class="flex gap-2 items-center">
                  <Kbd value="↵" />
                  <span class="text-xs">Open</span>
                </div>
              </div>
              <div class="flex gap-2 items-center">
                <Kbd value="Esc" />
                <span class="text-xs">Close</span>
              </div>
            </div>
          )}
        />
      }
    >
      {(props) => (
        <Button {...props} variant="outline" trailing={<KbdGroup items={['⌘', 'K']} />}>
          Search...
        </Button>
      )}
    </Dialog>
  )
}
