import { Button, DropdownMenu } from '@src'
import { createSignal } from 'solid-js'

export function Basic() {
  const [message, setMessage] = createSignal('Choose an action.')

  return (
    <div class="flex gap-3 items-center">
      <DropdownMenu
        items={[
          {
            label: 'Rename',
            icon: 'i-lucide:pencil',
            onSelect: () => setMessage('Rename selected.'),
          },
          { label: 'Duplicate', icon: 'i-lucide:copy', onSelect: () => setMessage('Duplicated.') },
          { type: 'separator' },
          {
            label: 'Delete',
            color: 'destructive',
            icon: 'i-lucide:trash-2',
            onSelect: () => setMessage('Deleted.'),
          },
        ]}
      >
        {(triggerProps) => (
          <Button {...triggerProps} variant="outline">
            Actions
          </Button>
        )}
      </DropdownMenu>
      <p class="text-sm text-muted-foreground">{message()}</p>
    </div>
  )
}
