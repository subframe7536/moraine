import { createSignal } from 'solid-js'

import { CheckboxGroup } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const ITEMS = [
  { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
  { value: 'beta', label: 'Beta', description: 'Early access channel' },
  { value: 'stable', label: 'Stable', description: 'Production channel' },
]

export default () => {
  const [value, setValue] = createSignal<string[]>(['beta'])

  return (
    <DemoPage componentKey="checkbox-group">
      <DemoSection
        title="Variants"
        description="Card and table variants with controlled and uncontrolled state."
      >
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 b-1 b-border border-zinc-200 rounded-lg">
            <CheckboxGroup
              legend="Card variant"
              items={ITEMS}
              variant="card"
              defaultValue={['alpha']}
            />
          </div>
          <div class="p-4 b-1 b-border border-zinc-200 rounded-lg space-y-3">
            <CheckboxGroup
              legend="Table variant (controlled)"
              items={ITEMS}
              orientation="horizontal"
              variant="table"
              value={value()}
              onChange={setValue}
            />
            <p class="text-xs text-zinc-600">Selected: {value().join(', ') || 'none'}</p>
          </div>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
