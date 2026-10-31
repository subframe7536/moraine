import { Badge, Button, Dialog } from '@src'
import { createSignal, Show } from 'solid-js'

export function StateDismissal() {
  const [open, setOpen] = createSignal(false)
  const [allowDismiss, setAllowDismiss] = createSignal(false)
  const [preventedAttempts, setPreventedAttempts] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Button onClick={() => setOpen(true)}>
        Open {allowDismiss() ? 'Dismissible' : 'Non-Dismissible'} Dialog
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          setAllowDismiss((prev) => !prev)
          setPreventedAttempts(0)
        }}
      >
        Mode: {allowDismiss() ? 'Overlay and Escape' : 'Strict (Buttons Only)'}
      </Button>

      <Dialog
        open={open()}
        onOpenChange={setOpen}
        closeOnOverlayClick={allowDismiss()}
        closeOnEscape={allowDismiss()}
        onClosePrevent={() => setPreventedAttempts((c) => c + 1)}
      >
        <Dialog.Content
          title="Unsaved Configuration Changes"
          description="Explicit confirmation is required before navigating away."
        >
          <Dialog.Body>
            <div class="py-2 space-y-3">
              <p class="text-sm text-muted-foreground">
                {allowDismiss()
                  ? 'Press Escape or click the backdrop to dismiss.'
                  : 'Clicking outside or pressing Escape is blocked. Use the action buttons below.'}
              </p>
              <Show when={preventedAttempts() > 0}>
                <Badge variant="outline" tone="danger">
                  Blocked {preventedAttempts()} outside dismissal attempt(s)
                </Badge>
              </Show>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <div class="flex gap-2 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setPreventedAttempts(0)
                }}
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => {
                  setOpen(false)
                  setPreventedAttempts(0)
                }}
              >
                Save & Apply
              </Button>
            </div>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  )
}
