import { createSignal } from 'solid-js'

import { Switch } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

export default () => {
  const [checked, setChecked] = createSignal(false)

  return (
    <DemoPage componentKey="switch">
      <DemoSection title="Basic" description="Toggle states with icon slots and controlled value.">
        <div class="flex flex-col gap-3 max-w-md">
          <Switch
            label="Email alerts"
            description="Uncontrolled state"
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
      </DemoSection>
    </DemoPage>
  )
}
