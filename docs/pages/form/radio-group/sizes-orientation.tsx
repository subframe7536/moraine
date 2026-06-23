import { RadioGroup } from '@src'
import type { RadioGroupT } from '@src'
import { For } from 'solid-js'

export function SizesOrientation() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const SIZES: RadioGroupSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type RadioGroupSizeName = Exclude<RadioGroupT.Variant['size'], undefined>

  return (
    <div class="gap-4 grid lg:grid-cols-2">
      <div class="space-y-3">
        <For each={SIZES}>
          {(size) => (
            <div class="p-4 b-(1 border) rounded-lg">
              <RadioGroup
                legend={`Size ${size}`}
                items={ITEMS}
                size={size}
                defaultValue="starter"
              />
            </div>
          )}
        </For>
      </div>
      <div class="space-y-3">
        <div class="p-4 b-(1 border) rounded-lg">
          <RadioGroup
            legend="Horizontal card"
            items={ITEMS}
            variant="card"
            orientation="horizontal"
            defaultValue="pro"
          />
        </div>
        <div class="p-4 b-(1 border) rounded-lg">
          <RadioGroup
            legend="Horizontal table"
            items={ITEMS}
            variant="table"
            orientation="horizontal"
            defaultValue="enterprise"
          />
        </div>
      </div>
    </div>
  )
}
