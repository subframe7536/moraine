import { Button, List } from '@src'
import { createSignal } from 'solid-js'

const INBOX = [
  { id: '1', title: 'Deploy failed on main', from: 'CI' },
  { id: '2', title: 'Review requested on #482', from: 'Elena' },
  { id: '3', title: 'Nightly backup completed', from: 'Ops' },
]

export function EmptyInbox() {
  const [items, setItems] = createSignal(INBOX)

  return (
    <div class="max-w-md w-full space-y-3">
      <List
        items={items()}
        fallback={<li class="text-sm text-muted-foreground px-3 py-2">Inbox is empty</li>}
        class="border border-border rounded-md overflow-hidden"
        itemRender={(row) => (
          <li class="px-3 py-2 border-b border-border last:border-b-0">
            <div class="text-sm font-medium">{row.item.title}</div>
            <div class="text-xs text-muted-foreground">{row.item.from}</div>
          </li>
        )}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={items().length === 0}
        onClick={() => setItems([])}
      >
        Clear inbox
      </Button>
    </div>
  )
}
