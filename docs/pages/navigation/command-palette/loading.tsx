import { Button, CommandPalette, Icon } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

export function Loading() {
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
  ]

  return (
    <div class="max-w-full w-lg">
      <CommandPalette open={open()} onOpenChange={setOpen} groups={BASIC_GROUPS} loading>
        <Button variant="outline">Open palette</Button>
      </CommandPalette>
    </div>
  )
}
