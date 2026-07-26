import { Button, CommandPalette, Icon, KbdGroup } from '@src'
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
      <CommandPalette open={open()} onOpenChange={setOpen} groups={BASIC_GROUPS} loading>
        <Button variant="outline">Open palette</Button>
      </CommandPalette>
    </div>
  )
}
