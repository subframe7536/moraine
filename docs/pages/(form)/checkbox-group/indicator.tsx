import { CheckboxGroup } from '@src'
import { For } from 'solid-js'

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

const INDICATORS = ['start', 'end', 'hidden'] as const

export function Indicator() {
  return (
    <div class="gap-4 grid md:grid-cols-2 xl:grid-cols-3">
      <For each={INDICATORS}>
        {(indicator) => (
          <div class="p-4 b-(1 border) rounded-xl space-y-2">
            <p class="text-xs text-muted-foreground tracking-wider font-semibold uppercase">
              Indicator: {indicator}
            </p>
            <CheckboxGroup
              legend="Activity alerts"
              items={NOTIFICATIONS}
              indicator={indicator}
              defaultValue={['mentions', 'review']}
            />
          </div>
        )}
      </For>
    </div>
  )
}
