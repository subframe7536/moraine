import { Button, Popup } from '@src'
import { createSignal } from 'solid-js'

export function DismissControl() {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <Popup
      dismissible={false}
      onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
      content={
        <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
          <h3 class="text-sm font-semibold">Persistent popup</h3>
          <p class="text-sm text-muted-foreground mt-1">Refresh to dismiss</p>
          <p class="text-sm text-muted-foreground mt-1">
            Prevented close attempts: {preventedCloseCount()}
          </p>
        </div>
      }
    >
      <Button variant="secondary">Dismiss blocked</Button>
    </Popup>
  )
}
