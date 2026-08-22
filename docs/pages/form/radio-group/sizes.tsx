import { FormField, RadioGroup } from '@src'
import type { RadioGroupT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  type RadioGroupSize = Exclude<RadioGroupT.Variant['size'], undefined>
  const SIZES: RadioGroupSize[] = ['sm', 'md', 'lg']

  return (
    <div class="gap-4 grid lg:grid-cols-3">
      <For each={SIZES}>
        {(size) => (
          <div class="p-4 b-(1 border) rounded-lg">
            <FormField label={`Size ${size}`}>
              <RadioGroup items={ITEMS} size={size} defaultValue="starter" />
            </FormField>
          </div>
        )}
      </For>
    </div>
  )
}
