import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['sm', 'md', 'lg'] as const

  const ITEMS: DropdownMenuT.Items[] = [
    {
      type: 'group',
      children: [
        {
          label: 'Profile',
          icon: 'i-lucide-user',
        },
        {
          label: 'Settings',
          icon: 'i-lucide-settings-2',
        },
        {
          label: 'Sign Out',
          icon: 'i-lucide-log-out',
          color: 'destructive',
        },
      ],
    },
  ]

  return (
    <div class="flex flex-wrap gap-3">
      <For each={SIZES}>
        {(size) => (
          <DropdownMenu size={size} items={ITEMS}>
            <Button variant="outline" size="sm">
              {size} Menu
            </Button>
          </DropdownMenu>
        )}
      </For>
    </div>
  )
}
