import { RadioGroup } from '@src'
import type { RadioGroupT } from '@src'
import { For } from 'solid-js'

export function IndicatorPositions() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const INDICATORS: RadioGroupIndicatorName[] = ['start', 'end', 'hidden']

  type RadioGroupIndicatorName = Exclude<RadioGroupT.Variant['indicator'], undefined>

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={INDICATORS}>
        {(indicator) => (
          <div class="p-4 b-(1 border) rounded-lg">
            <RadioGroup
              legend={`Indicator ${indicator}`}
              items={ITEMS}
              variant="card"
              indicator={indicator}
              defaultValue="pro"
            />
          </div>
        )}
      </For>
    </div>
  )
}
