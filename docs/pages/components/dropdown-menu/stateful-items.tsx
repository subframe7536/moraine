import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function StatefulItems() {
  const [showBookmarks, setShowBookmarks] = createSignal(true)
  const [theme, setTheme] = createSignal('system')

  const items = createMemo<DropdownMenuT.Item[]>(() => [
    {
      type: 'checkbox',
      label: 'Show bookmarks bar',
      checked: showBookmarks(),
      onCheckedChange: setShowBookmarks,
    },
    { type: 'separator' },
    {
      label: 'Theme',
      children: [
        {
          type: 'radio-group',
          value: theme(),
          onValueChange: setTheme,
          items: [
            { type: 'radio', label: 'Light', value: 'light' },
            { type: 'radio', label: 'Dark', value: 'dark' },
            { type: 'radio', label: 'System', value: 'system' },
          ],
        },
      ],
    },
  ])

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger as={Button} variant="outline">
        View preferences
      </DropdownMenu.Trigger>
      <DropdownMenu.Content items={items()} />
    </DropdownMenu>
  )
}
