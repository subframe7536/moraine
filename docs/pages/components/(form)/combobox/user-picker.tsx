import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const USERS: ComboboxT.Item[] = [
  {
    label: 'Sarah Connor',
    value: 'sarah',
    icon: 'i-lucide:user',
    description: 'sarah@example.com · Engineering Lead',
  },
  {
    label: 'Alex Rivera',
    value: 'alex',
    icon: 'i-lucide:user',
    description: 'alex@example.com · Product Designer',
  },
  {
    label: 'Elena Rostova',
    value: 'elena',
    icon: 'i-lucide:user',
    description: 'elena@example.com · Frontend Engineer',
  },
  {
    label: 'David Kim',
    value: 'david',
    icon: 'i-lucide:user',
    description: 'david@example.com · DevOps Specialist',
  },
]

export function UserPicker() {
  return (
    <div class="max-w-sm w-full space-y-2">
      <label class="text-muted-foreground font-medium block text-xs">Assignee</label>
      <Combobox
        items={USERS}
        placeholder="Assign to teammate..."
        leadingIcon="i-lucide:user-plus"
        openOnControlClick
        allowClear
      />
    </div>
  )
}
