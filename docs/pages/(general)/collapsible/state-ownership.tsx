import { Button, Collapsible } from '@src'
import { createSignal } from 'solid-js'

export function StateOwnership() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="max-w-md w-full space-y-3">
      <Collapsible
        open={open()}
        onOpenChange={setOpen}
        label={open() ? 'Hide advanced settings' : 'Show advanced settings'}
      >
        <div class="text-sm text-muted-foreground mt-2 p-3 b-(1 border) rounded-lg">
          Advanced configuration parameters and telemetry endpoints.
        </div>
      </Collapsible>
      <div class="flex gap-2 items-center">
        <Button size="xs" variant="outline" onClick={() => setOpen((v) => !v)}>
          External toggle ({open() ? 'open' : 'closed'})
        </Button>
      </div>
    </div>
  )
}
