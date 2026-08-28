import { CheckboxGroup } from '@src'
import { createSignal } from 'solid-js'

const NOTIFICATION_OPTIONS = [
  {
    label: 'Email alerts',
    value: 'email',
    description: 'Immediate notifications for critical events.',
  },
  {
    label: 'Weekly digest',
    value: 'digest',
    description: 'Summary of team activity and metric trends.',
  },
  { label: 'SMS updates', value: 'sms', description: 'Urgent security and billing alerts only.' },
]

export function SelectionModel() {
  const [selected, setSelected] = createSignal<string[]>(['email', 'digest'])

  return (
    <div class="flex flex-col gap-3">
      <CheckboxGroup
        legend="Notification preferences"
        items={NOTIFICATION_OPTIONS}
        value={selected()}
        onChange={setSelected}
      />
      <p class="text-xs text-muted-foreground">
        Selected values: <span class="text-foreground font-mono">{JSON.stringify(selected())}</span>
      </p>
    </div>
  )
}
