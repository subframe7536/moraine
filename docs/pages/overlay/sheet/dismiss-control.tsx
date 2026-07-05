import { Button, Sheet } from '@src'
import { createSignal } from 'solid-js'

export function DismissControl() {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Sheet
        defaultOpen
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
        title="Persistent sheet"
        body={
          <p class="text-sm text-foreground">
            Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
          </p>
        }
      >
        <Button variant="outline">Dismiss blocked</Button>
      </Sheet>
    </div>
  )
}
