import { CheckboxGroup } from '@src'

export function Variants() {
  const ITEMS = [
    { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
    { value: 'beta', label: 'Beta', description: 'Early access channel' },
    { value: 'stable', label: 'Stable', description: 'Production channel' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-lg">
        <CheckboxGroup legend="List" items={ITEMS} defaultValue={['alpha']} />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <CheckboxGroup legend="Card" items={ITEMS} variant="card" defaultValue={['beta']} />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <CheckboxGroup legend="Table" items={ITEMS} variant="table" defaultValue={['stable']} />
      </div>
    </div>
  )
}
