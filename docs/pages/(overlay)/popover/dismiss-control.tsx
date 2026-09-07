import { Button, Popover } from '@src'
import { createSignal } from 'solid-js'

export function DismissControl() {
  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Popover
        defaultOpen
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
      >
        <Popover.Trigger as={Button} variant="secondary">
          Try close me
        </Popover.Trigger>
        <Popover.Content
          content={
            <div class="p-3 space-y-1">
              <p class="text-sm font-medium">Persistent popover</p>
              <p class="text-xs text-muted-foreground">
                Prevented close attempts: {preventedCloseCount()}
              </p>
            </div>
          }
        />
      </Popover>
    </div>
  )
}
