import { CheckboxGroup } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const ADDONS = [
    {
      value: 'backups',
      label: 'Daily backups',
      description: 'Automated 30-day point-in-time recovery',
    },
    {
      value: 'security',
      label: 'DDoS protection',
      description: 'Advanced Layer 7 traffic scrubbing',
    },
    {
      value: 'support',
      label: '24/7 SLA support',
      description: 'Guaranteed 15-minute response time',
    },
  ]

  const SIZES = ['sm', 'md', 'lg'] as const

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => (
          <div class="p-4 b-(1 border) rounded-xl">
            <CheckboxGroup
              legend={`Add-ons (${size})`}
              items={ADDONS}
              variant="card"
              size={size}
              defaultValue={size === 'sm' ? ['backups'] : ['backups', 'security']}
            />
          </div>
        )}
      </For>
    </div>
  )
}
