import { Button, CommandPalette } from '@src'
import type { CommandPaletteT } from '@src'
import { createSignal } from 'solid-js'

export function Position() {
  const [open, setOpen] = createSignal(false)
  const GROUPS: CommandPaletteT.Group[] = [
    {
      id: 'actions',
      label: 'Actions',
      items: [
        {
          value: 'new-file',
          label: 'New File',
          leadingRender: () => <span class="i-lucide-file-plus" />,
          trailingRender: () => <span class="text-xs text-muted-foreground">⌘N</span>,
        },
        {
          value: 'new-folder',
          label: 'New Folder',
          leadingRender: () => <span class="i-lucide-folder-plus" />,
        },
        {
          value: 'settings',
          label: 'Settings',
          leadingRender: () => <span class="i-lucide-settings" />,
        },
      ],
    },
  ]

  const [pos, setPos] = createSignal({ top: 0, left: 0 })

  return (
    <div class="flex flex-col gap-3 max-w-full w-lg">
      <CommandPalette
        open={open()}
        onOpenChange={setOpen}
        groups={GROUPS}
        position={{ top: 80 }}
        onPositionChange={setPos}
        classes={{ content: 'w-lg max-w-[calc(100vw-2rem)]' }}
      >
        <Button variant="outline">Open palette</Button>
      </CommandPalette>
      <p class="text-xs text-muted-foreground">
        Actual position: top={pos().top}px, left={pos().left}px
      </p>
    </div>
  )
}
