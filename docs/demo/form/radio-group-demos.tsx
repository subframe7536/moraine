import { createSignal } from 'solid-js'

import { RadioGroup } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const ITEMS = [
  { value: 'starter', label: 'Starter', description: 'For personal projects' },
  { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
  { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
]

export default () => {
  const [value, setValue] = createSignal('pro')

  return (
    <DemoPage componentKey="radio-group">
      <DemoSection
        title="Variants"
        description="List, card, and table variants with controlled value."
      >
        <div class="mb-4 p-4 b-1 b-border border-zinc-200 rounded-lg">
          <RadioGroup legend="Default list" items={ITEMS} defaultValue="pro" />
        </div>
        <div class="gap-4 grid sm:grid-cols-2">
          <div class="p-4 b-1 b-border border-zinc-200 rounded-lg">
            <RadioGroup legend="Card variant" items={ITEMS} variant="card" defaultValue="starter" />
          </div>
          <div class="p-4 b-1 b-border border-zinc-200 rounded-lg space-y-3">
            <RadioGroup
              legend="Table variant (controlled)"
              items={ITEMS}
              orientation="horizontal"
              variant="table"
              value={value()}
              onChange={setValue}
            />
            <p class="text-xs text-zinc-600">Plan: {value()}</p>
          </div>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
