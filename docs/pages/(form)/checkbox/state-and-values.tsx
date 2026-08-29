import { Checkbox } from '@src'
import { createSignal } from 'solid-js'

export function StateAndValues() {
  const [checked, setChecked] = createSignal(true)

  return (
    <div class="flex flex-col gap-3">
      <Checkbox
        checked={checked()}
        onChange={setChecked}
        label="Subscribe to product updates"
        description="Receive weekly summaries of new releases and features."
      />
      <p class="text-xs text-muted-foreground">
        Current state:{' '}
        <span class="text-foreground font-medium">{checked() ? 'checked' : 'unchecked'}</span>
      </p>
    </div>
  )
}
