import { Button, DropdownMenu } from '@src'

export function ShortcutsDisabled() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger as={Button} variant="outline">
        Share
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        items={[
          { label: 'Copy link', icon: 'i-lucide:link', kbds: ['⌘', 'C'] },
          { label: 'Export', icon: 'i-lucide:download', kbds: ['⌘', 'E'], disabled: true },
        ]}
      />
    </DropdownMenu>
  )
}
