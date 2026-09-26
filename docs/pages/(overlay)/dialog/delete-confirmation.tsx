import { Button, Dialog } from '@src'
import { createSignal, Show } from 'solid-js'

export function DeleteConfirmation() {
  const [exists, setExists] = createSignal(true)
  const [open, setOpen] = createSignal(false)

  return (
    <div class="flex gap-3 items-center">
      <Show when={exists()} fallback={<p class="text-sm">Saved filter removed.</p>}>
        <span class="text-sm">Saved filter: Assigned to me</span>
        <Dialog open={open()} onOpenChange={setOpen}>
          <Dialog.Trigger as={Button} variant="outline" size="sm">
            Delete
          </Dialog.Trigger>
          <Dialog.Content
            title="Delete saved filter?"
            description="Assigned to me will be removed from your saved filters."
          >
            <Dialog.Body>
              <p class="text-sm">You can create another filter later.</p>
            </Dialog.Body>
            <Dialog.Footer>
              <div class="flex gap-2 w-full justify-end">
                <Dialog.Close as={Button} variant="outline">
                  Cancel
                </Dialog.Close>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setExists(false)
                    setOpen(false)
                  }}
                >
                  Delete filter
                </Button>
              </div>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Show>
    </div>
  )
}
