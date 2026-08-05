import { Button, ContextMenu } from '@src'
import type { ContextMenuT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['sm', 'md', 'lg'] as const

  const ITEMS: ContextMenuT.Item[] = [
    {
      type: 'group',
      children: [
        {
          label: 'Open',
          icon: 'i-lucide-folder-open',
        },
        {
          label: 'Rename',
          icon: 'i-lucide-pencil',
        },
        {
          label: 'Delete',
          icon: 'i-lucide-trash-2',
          color: 'destructive',
        },
      ],
    },
  ]

  return (
    <div class="flex flex-wrap gap-3">
      <For each={SIZES}>
        {(size) => (
          <ContextMenu size={size} items={ITEMS}>
            {(props) => (
              <Button {...props} variant="outline">
                Right click ({size})
              </Button>
            )}
          </ContextMenu>
        )}
      </For>
    </div>
  )
}
