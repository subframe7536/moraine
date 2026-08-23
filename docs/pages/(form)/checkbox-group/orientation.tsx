import { CheckboxGroup } from '@src'

const ITEMS = [
  { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
  { value: 'beta', label: 'Beta', description: 'Early access channel' },
  { value: 'stable', label: 'Stable', description: 'Production channel' },
]

const HORIZONTAL_ITEMS = [
  { value: 'alpha', label: 'Alpha', description: 'Primary' },
  { value: 'beta', label: 'Beta', description: 'Early access' },
  { value: 'stable', label: 'Stable', description: 'Production' },
]

export function Orientation() {
  return (
    <div class="gap-4 grid md:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-lg space-y-1">
        <CheckboxGroup legend="Vertical" items={ITEMS} defaultValue={['beta']} />
      </div>
      <div class="p-4 b-(1 border) rounded-lg space-y-1">
        <CheckboxGroup
          legend="Horizontal"
          items={HORIZONTAL_ITEMS}
          orientation="horizontal"
          defaultValue={['alpha']}
          classes={{
            fieldset: 'flex-wrap',
            item: 'min-w-26 flex-1',
          }}
        />
      </div>
    </div>
  )
}
