import { Button } from '@src'
import { useAlertDialog } from '@src/utils'
import { createSignal, Show } from 'solid-js'

export function AlertConfirm() {
  const [alert, Holder] = useAlertDialog()
  const [exists, setExists] = createSignal(true)

  const confirmDelete = async () => {
    const confirmed = await alert.confirm({
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
      <Holder />
    </div>
  )
}
