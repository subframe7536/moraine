import { CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'

export function WithCloseButton() {
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
      <CommandPalette groups={BASIC_GROUPS} autofocus={false} showClose />
    </div>
  )
}
