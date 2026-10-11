import { AlertDialog, Button } from '@src'
import { createSignal, Show } from 'solid-js'

export function AlertConfirm() {
  const [exists, setExists] = createSignal(true)

  const confirmDelete = async () => {
    const confirmed = await AlertDialog.confirm({
      title: 'Delete saved filter?',
      description: 'Assigned to me will be removed from your saved filters.',
      content: 'You can create another filter later.',
      danger: true,
      okText: 'Delete filter',
    })
    if (confirmed) {
      setExists(false)
    }
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Show when={exists()} fallback={<p class="text-sm">Saved filter removed.</p>}>
        <span class="text-sm">Saved filter: Assigned to me</span>
        <Button variant="outline" size="sm" onClick={() => void confirmDelete()}>
          Delete
        </Button>
      </Show>
    </div>
  )
}
