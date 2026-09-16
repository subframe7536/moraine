import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const STATUSES: ComboboxT.Item[] = [
  {
    label: 'Backlog',
    value: 'backlog',
    icon: 'i-lucide:circle-dashed',
    description: 'Ideas and unprioritized tasks',
  },
  {
    label: 'Todo',
    value: 'todo',
    icon: 'i-lucide:circle',
    description: 'Ready to be picked up',
  },
  {
    label: 'In Progress',
    value: 'in-progress',
    icon: 'i-lucide:circle-dot',
    description: 'Work actively underway',
  },
  {
    label: 'In Review',
    value: 'review',
    icon: 'i-lucide:clock',
    description: 'PR open and waiting for review',
  },
  {
    label: 'Done',
    value: 'done',
    icon: 'i-lucide:check-circle-2',
    description: 'Completed and merged',
  },
  {
    label: 'Canceled',
    value: 'canceled',
    icon: 'i-lucide:x-circle',
    description: 'Discarded or not planned',
  },
]

export function CustomItems() {
  return (
    <div class="max-w-sm w-full space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">Issue Status</label>
      <Combobox
        items={STATUSES}
        defaultValue="in-progress"
        placeholder="Filter status..."
        openOnControlClick
      />
    </div>
  )
}
