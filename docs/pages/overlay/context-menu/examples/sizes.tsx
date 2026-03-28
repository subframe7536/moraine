import { ContextMenu } from '@src'
import type { ContextMenuT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['sm', 'md', 'lg'] as const

  const ITEMS: ContextMenuT.Items[] = [
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
            <button
              type="button"
              class="text-sm px-3 py-2 b-1 b-border border-border rounded-md bg-background"
            >
              Right click ({size})
            </button>
          </ContextMenu>
        )}
      </For>
    </div>
  )
}
