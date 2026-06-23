import { CheckboxGroup } from '@src'
import { For } from 'solid-js'

const ITEMS = [
  { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
  { value: 'beta', label: 'Beta', description: 'Early access channel' },
  { value: 'stable', label: 'Stable', description: 'Production channel' },
]

const INDICATORS = ['start', 'end', 'hidden'] as const

export function Indicator() {
  return (
    <div class="gap-4 grid md:grid-cols-2 xl:grid-cols-3">
      <For each={INDICATORS}>
        {(indicator) => (
          <div class="p-4 b-(1 border) rounded-lg space-y-1">
            <p class="text-xs text-muted-foreground">Indicator: {indicator}</p>
            <CheckboxGroup
              legend="Channels"
              items={ITEMS}
              indicator={indicator}
              defaultValue={['beta']}
            />
          </div>
        )}
      </For>
    </div>
  )
}
