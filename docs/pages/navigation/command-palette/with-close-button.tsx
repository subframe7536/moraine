import { Button, CommandPalette } from '@src'
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
          leadingRender: () => <span class="i-lucide-circle-plus" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">⌘N</span>,
        },
        {
          value: 'open-inbox',
          label: 'Open Inbox',
          leadingRender: () => <span class="i-lucide-inbox" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">GI</span>,
        },
        {
          value: 'sync-roadmap',
          label: 'Sync Roadmap',
          leadingRender: () => <span class="i-lucide-refresh-cw" />,
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
          leadingRender: () => <span class="i-lucide-layout-dashboard" />,
        },
        {
          value: 'go-projects',
          label: 'Projects',
          leadingRender: () => <span class="i-lucide-folder-kanban" />,
        },
        {
          value: 'go-settings',
          label: 'Settings',
          leadingRender: () => <span class="i-lucide-settings" />,
          description: 'Preferences',
        },
        {
          value: 'go-billing',
          label: 'Billing',
          leadingRender: () => <span class="i-lucide-credit-card" />,
          disabled: true,
        },
      ],
    },
  ]

  const [closeCount, setCloseCount] = createSignal(0)

  return (
    <>
      <div class="max-w-full w-lg">
        <CommandPalette
          open={open()}
          onOpenChange={setOpen}
          groups={BASIC_GROUPS}
          showClose
          onClose={() => setCloseCount((c) => c + 1)}
        >
          <Button variant="outline">Open palette</Button>
        </CommandPalette>
      </div>
      <p class="text-sm text-muted-foreground mt-2">Close clicked: {closeCount()} time(s)</p>
    </>
  )
}
