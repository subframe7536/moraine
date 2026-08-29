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
          type: 'radio',
          group: 'theme',
          label: 'Light',
          value: 'light',
          checked: theme() === 'light',
          onValueChange: setTheme,
        },
        {
          type: 'radio',
          group: 'theme',
          label: 'Dark',
          value: 'dark',
          checked: theme() === 'dark',
          onValueChange: setTheme,
        },
        {
          type: 'radio',
          group: 'theme',
          label: 'System',
          value: 'system',
          checked: theme() === 'system',
          onValueChange: setTheme,
        },
      ],
    },
  ])

  return (
    <DropdownMenu items={items()}>
      {(props) => (
        <Button {...props} variant="outline">
          View preferences
        </Button>
      )}
    </DropdownMenu>
  )
}
