import { Switch } from '@src'
import { createSignal } from 'solid-js'

export function BasicControlled() {
  const [checked, setChecked] = createSignal(false)

  return (
    <div class="flex flex-col gap-3 max-w-xl">
      <Switch
        label="Email alerts"
        description="Uncontrolled"
        defaultChecked
        checkedIcon="i-lucide-bell"
        uncheckedIcon="i-lucide-bell-off"
      />
      <Switch
        label="Deploy protection"
        description={`Current: ${checked() ? 'enabled' : 'disabled'}`}
        checked={checked()}
        onChange={setChecked}
        checkedIcon="i-lucide-shield-check"
        uncheckedIcon="i-lucide-shield"
      />
    </div>
  )
}
