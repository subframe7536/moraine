import { CheckboxGroup } from '@src'

const NOTIFICATIONS = [
  {
    value: 'mentions',
    label: 'Direct @mentions',
    description: 'When someone mentions you in a thread',
  },
  { value: 'assignee', label: 'Issue assigned', description: 'When an issue is assigned to you' },
  {
    value: 'review',
    label: 'Review requested',
    description: 'When your review is required on a PR',
  },
]

export function Indicator() {
  return (
    <div class="max-w-md w-full">
      <CheckboxGroup
        legend="Activity alerts"
        variant="card"
        indicator="end"
        items={NOTIFICATIONS}
        defaultValue={['mentions', 'review']}
      />
    </div>
  )
}
