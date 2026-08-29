import { Button, DropdownMenu } from '@src'

export function ShortcutsDisabled() {
  return (
    <DropdownMenu
      items={[
        { label: 'Copy link', icon: 'i-lucide:link', kbds: ['⌘', 'C'] },
        { label: 'Export', icon: 'i-lucide:download', kbds: ['⌘', 'E'], disabled: true },
      ]}
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline">
          Share
        </Button>
      )}
    </DropdownMenu>
  )
}
