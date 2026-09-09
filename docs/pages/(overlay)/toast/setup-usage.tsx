import { Button } from '@src'
import { toast, Toaster } from 'solid-toaster'

export function SetupUsage() {
  return (
    <div class="space-y-4">
      <Toaster position="bottom-right" />
      <Button onClick={() => toast('Event notification triggered')}>Trigger Basic Toast</Button>
    </div>
  )
}
