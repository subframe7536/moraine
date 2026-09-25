import { ContextMenu } from '@src'
import { createSignal } from 'solid-js'

export function Basic() {
  const [message, setMessage] = createSignal('Right click the target.')

  return (
    <div class="space-y-3">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-muted-foreground border border-border border-dashed flex h-28 max-w-sm select-none items-center justify-center text-sm rounded-lg"
        >
          Right click here
        </ContextMenu.Trigger>
        <ContextMenu.Content
          items={[
            { label: 'Copy', icon: 'i-lucide:copy', onSelect: () => setMessage('Copied.') },
            {
              label: 'Rename',
              icon: 'i-lucide:pencil',
              onSelect: () => setMessage('Rename selected.'),
            },
            { type: 'separator' },
            { label: 'Delete', variant: 'destructive', icon: 'i-lucide:trash-2' },
          ]}
        />
      </ContextMenu>
      <p class="text-muted-foreground text-sm">{message()}</p>
    </div>
  )
}
