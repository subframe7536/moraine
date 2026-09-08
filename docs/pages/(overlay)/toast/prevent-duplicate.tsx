import 'solid-toaster/style.css'

import { Button } from '@src'
import { Toaster, toast } from 'solid-toaster'

export function PreventDuplicate() {
  const TOASTER_STYLE = {
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-3 items-center">
        <Button
          variant="outline"
          onClick={() =>
            toast.warning('Network connection unstable', { toasterId: 'prevent-dup-demo' })
          }
        >
          Trigger Same Warning (Multiple Clicks)
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.info(`Event at ${new Date().toLocaleTimeString()}`, {
              toasterId: 'prevent-dup-demo',
            })
          }
        >
          Trigger Unique Message
        </Button>
      </div>
      <p class="text-xs text-muted-foreground">
        Clicking the warning button repeatedly will not spawn duplicate toast cards while one is
        already active.
      </p>
      <Toaster
        id="prevent-dup-demo"
        preventDuplicate
        position="bottom-center"
        style={TOASTER_STYLE}
      />
    </div>
  )
}
