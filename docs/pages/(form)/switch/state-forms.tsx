import { Switch } from '@src'
import { createSignal } from 'solid-js'

export function StateForms() {
  const [enabled, setEnabled] = createSignal(true)

  return (
    <div class="max-w-md w-full space-y-3">
      <Switch
        checked={enabled()}
        onChange={setEnabled}
        label="Airplane mode"
        description="Disable all wireless connections."
      />
      <p class="text-xs text-muted-foreground">
        Status:{' '}
        <span class="text-foreground font-medium">{enabled() ? 'Enabled' : 'Disabled'}</span>
      </p>
    </div>
  )
}
