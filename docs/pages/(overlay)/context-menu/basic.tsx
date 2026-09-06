import { ContextMenu } from '@src'
import { createSignal } from 'solid-js'

export function Basic() {
  const [message, setMessage] = createSignal('Right click the target.')

  return (
    <div class="space-y-3">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="text-sm text-muted-foreground border border-border rounded-lg border-dashed flex h-28 max-w-sm select-none items-center justify-center"
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
            { label: 'Delete', color: 'destructive', icon: 'i-lucide:trash-2' },
          ]}
        />
      </ContextMenu>
      <p class="text-sm text-muted-foreground">{message()}</p>
    </div>
  )
}
