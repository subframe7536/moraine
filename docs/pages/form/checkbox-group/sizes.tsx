import { CheckboxGroup } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const ITEMS = [
    { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
    { value: 'beta', label: 'Beta', description: 'Early access channel' },
    { value: 'stable', label: 'Stable', description: 'Production channel' },
  ]

  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => (
          <div class="p-4 b-(1 border) rounded-lg">
            <CheckboxGroup
              legend={`Size ${size}`}
              items={ITEMS}
              variant="card"
              size={size}
              defaultValue={size === 'xs' ? ['alpha'] : ['stable']}
            />
          </div>
        )}
      </For>
    </div>
  )
}
